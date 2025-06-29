import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  Book, 
  Video, 
  MessageSquare, 
  Search,
  ExternalLink,
  FileText,
  Brain,
  Settings,
  Download,
  Cpu,
  PlayCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Code,
  Terminal
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface GuideSection {
  title: string;
  icon: React.ElementType;
  description: string;
  steps: string[];
}

export function Help() {
  const [searchTerm, setSearchTerm] = useState('');

  const faqItems: FAQItem[] = [
    {
      question: "What is a ModelFile?",
      answer: "A ModelFile is a configuration file that defines how to create a custom Ollama model. It includes the base model, parameters, system prompts, and other settings that customize the model's behavior.",
      category: "basics"
    },
    {
      question: "How do I create my first custom model?",
      answer: "Use the AI Assistant to generate a ModelFile based on your requirements, save it to your ModelFiles collection, then use the Create Model page to build the actual model from your ModelFile.",
      category: "getting-started"
    },
    {
      question: "What are the different model parameters?",
      answer: "Key parameters include: Temperature (creativity), Top P (nucleus sampling), Top K (vocabulary limit), Context Length (memory), and Repeat Penalty (repetition control). Each affects how the model generates responses.",
      category: "parameters"
    },
    {
      question: "Why can't I connect to Ollama?",
      answer: "Make sure Ollama is installed and running on your system. The service should be accessible at localhost:11434. Check if the Ollama service is started and no firewall is blocking the connection.",
      category: "troubleshooting"
    },
    {
      question: "How do I download new models?",
      answer: "Use the Downloads page to browse available models, search the Ollama library, or directly download models by name. You can also use the command 'ollama pull model-name' in your terminal.",
      category: "models"
    },
    {
      question: "What's the difference between base models?",
      answer: "Different base models have different strengths: Llama for general use, CodeLlama for programming, Mistral for efficiency, Gemma for research tasks. Choose based on your specific use case.",
      category: "models"
    },
    {
      question: "How do I optimize model performance?",
      answer: "Adjust parameters based on your needs: Lower temperature for factual responses, higher for creativity. Increase context length for longer conversations. Monitor memory usage in the Running Models page.",
      category: "optimization"
    },
    {
      question: "Can I share my ModelFiles?",
      answer: "Yes! You can download ModelFiles as text files and share them with others. They can import them into their own Ollama Model Creator and create the same custom models.",
      category: "sharing"
    }
  ];

  const guides: GuideSection[] = [
    {
      title: "Getting Started",
      icon: Lightbulb,
      description: "Learn the basics of creating custom models",
      steps: [
        "Install and start Ollama on your system",
        "Download a base model (like llama3.2) from the Downloads page",
        "Use the AI Assistant to create your first ModelFile",
        "Save the ModelFile to your collection",
        "Create a custom model using the Create Model page",
        "Test your model in the AI Assistant or external tools"
      ]
    },
    {
      title: "Using the AI Assistant",
      icon: MessageSquare,
      description: "Get help creating ModelFiles with AI",
      steps: [
        "Describe what kind of model you want to create",
        "Ask for specific parameters or system prompts",
        "Review the generated ModelFile in the output panel",
        "Edit the ModelFile if needed",
        "Save it to your ModelFiles collection",
        "Use quick templates for common model types"
      ]
    },
    {
      title: "Managing Models",
      icon: Brain,
      description: "Organize and maintain your model collection",
      steps: [
        "View all installed models in the Models page",
        "Monitor running models and memory usage",
        "Download new models from the Ollama library",
        "Copy and modify existing models",
        "Delete unused models to save space",
        "Check model information and details"
      ]
    },
    {
      title: "Creating Custom Models",
      icon: Settings,
      description: "Build models with specific behaviors",
      steps: [
        "Start with a ModelFile (create new or use existing)",
        "Configure model parameters for your use case",
        "Write or customize the system prompt",
        "Review the generated ModelFile",
        "Create the model (this may take several minutes)",
        "Test and iterate on your model"
      ]
    }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Help & Documentation</h1>
        <p className="text-gray-600">Learn how to use the Ollama Model Creator effectively</p>
      </div>

      <Tabs defaultValue="guides" className="w-full">
        <TabsList className="grid w-full grid-cols-4 border-4 border-black bg-white">
          <TabsTrigger 
            value="guides" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Book className="w-4 h-4 mr-2" />
            Guides
          </TabsTrigger>
          <TabsTrigger 
            value="faq" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger 
            value="reference" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <Code className="w-4 h-4 mr-2" />
            Reference
          </TabsTrigger>
          <TabsTrigger 
            value="support" 
            className="data-[state=active]:bg-black data-[state=active]:text-white border-2 border-black"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.map((guide, index) => (
              <Card key={index} className="p-6 border-4 border-black bg-white">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <guide.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">{guide.title}</h3>
                    <p className="text-sm text-gray-600">{guide.description}</p>
                  </div>
                </div>
                <ol className="space-y-2">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start space-x-3">
                      <Badge variant="outline" className="border-black text-xs mt-0.5">
                        {stepIndex + 1}
                      </Badge>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>

          {/* Quick Start Card */}
          <Card className="p-6 border-4 border-black bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black">Quick Start</h3>
                <p className="text-gray-600">Get up and running in 5 minutes</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-bold text-black">Download a Model</h4>
                <p className="text-sm text-gray-600">Get llama3.2 from Downloads</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-bold text-black">Create ModelFile</h4>
                <p className="text-sm text-gray-600">Use AI Assistant to generate</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-bold text-black">Build Model</h4>
                <p className="text-sm text-gray-600">Create your custom model</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          {/* Search */}
          <Card className="p-4 border-4 border-black bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-black"
              />
            </div>
          </Card>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.map((item, index) => (
              <Card key={index} className="p-6 border-4 border-black bg-white">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black mb-2">{item.question}</h3>
                    <p className="text-gray-700 mb-3">{item.answer}</p>
                    <Badge variant="outline" className="border-gray-300 text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredFAQ.length === 0 && (
            <Card className="p-8 border-4 border-black bg-white text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-black">No Results Found</h3>
                <p className="text-gray-600">
                  No FAQ items match your search. Try different keywords or browse all categories.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reference" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ModelFile Syntax */}
            <Card className="p-6 border-4 border-black bg-white">
              <h3 className="text-xl font-bold text-black mb-4">ModelFile Syntax</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono">FROM &lt;model&gt;</code>
                  <p className="text-gray-600 mt-1">Specify the base model to use</p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono">PARAMETER &lt;name&gt; &lt;value&gt;</code>
                  <p className="text-gray-600 mt-1">Set model parameters</p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono">SYSTEM "&lt;prompt&gt;"</code>
                  <p className="text-gray-600 mt-1">Define system behavior</p>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono">TEMPLATE "&lt;template&gt;"</code>
                  <p className="text-gray-600 mt-1">Custom prompt template</p>
                </div>
              </div>
            </Card>

            {/* Parameters Reference */}
            <Card className="p-6 border-4 border-black bg-white">
              <h3 className="text-xl font-bold text-black mb-4">Common Parameters</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>temperature</strong> <Badge variant="outline" className="ml-2">0.1-2.0</Badge>
                  <p className="text-gray-600">Controls randomness (lower = more focused)</p>
                </div>
                <div>
                  <strong>top_p</strong> <Badge variant="outline" className="ml-2">0.1-1.0</Badge>
                  <p className="text-gray-600">Nucleus sampling threshold</p>
                </div>
                <div>
                  <strong>top_k</strong> <Badge variant="outline" className="ml-2">1-100</Badge>
                  <p className="text-gray-600">Limits vocabulary for each step</p>
                </div>
                <div>
                  <strong>num_ctx</strong> <Badge variant="outline" className="ml-2">512-32768</Badge>
                  <p className="text-gray-600">Context window size</p>
                </div>
                <div>
                  <strong>repeat_penalty</strong> <Badge variant="outline" className="ml-2">0.5-2.0</Badge>
                  <p className="text-gray-600">Penalizes repetition</p>
                </div>
              </div>
            </Card>

            {/* CLI Commands */}
            <Card className="p-6 border-4 border-black bg-white">
              <h3 className="text-xl font-bold text-black mb-4">Useful Commands</h3>
              <div className="space-y-3">
                <div>
                  <code className="bg-gray-900 text-green-400 px-3 py-2 rounded block font-mono text-sm">
                    ollama list
                  </code>
                  <p className="text-gray-600 text-sm mt-1">List installed models</p>
                </div>
                <div>
                  <code className="bg-gray-900 text-green-400 px-3 py-2 rounded block font-mono text-sm">
                    ollama pull llama3.2
                  </code>
                  <p className="text-gray-600 text-sm mt-1">Download a model</p>
                </div>
                <div>
                  <code className="bg-gray-900 text-green-400 px-3 py-2 rounded block font-mono text-sm">
                    ollama create mymodel -f Modelfile
                  </code>
                  <p className="text-gray-600 text-sm mt-1">Create custom model</p>
                </div>
                <div>
                  <code className="bg-gray-900 text-green-400 px-3 py-2 rounded block font-mono text-sm">
                    ollama rm model-name
                  </code>
                  <p className="text-gray-600 text-sm mt-1">Remove a model</p>
                </div>
              </div>
            </Card>

            {/* Troubleshooting */}
            <Card className="p-6 border-4 border-black bg-white">
              <h3 className="text-xl font-bold text-black mb-4">Troubleshooting</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <strong className="text-black">Connection Failed</strong>
                    <p className="text-sm text-gray-600">Check if Ollama is running on port 11434</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <strong className="text-black">Model Creation Slow</strong>
                    <p className="text-sm text-gray-600">Large models take time, ensure sufficient disk space</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <strong className="text-black">Memory Issues</strong>
                    <p className="text-sm text-gray-600">Monitor running models, unload unused ones</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Support */}
            <Card className="p-6 border-4 border-black bg-white">
              <h3 className="text-xl font-bold text-black mb-4">Get Help</h3>
              <div className="space-y-4">
                <Button
                  onClick={() => window.open('https://ollama.com/docs', '_blank')}
                  variant="outline"
                  className="w-full justify-start border-2 border-black hover:bg-black hover:text-white"
                >
                  <Book className="w-4 h-4 mr-2" />
                  Official Ollama Documentation
                </Button>
                <Button
                  onClick={() => window.open('https://github.com/ollama/ollama', '_blank')}
                  variant="outline"
                  className="w-full justify-start border-2 border-black hover:bg-black hover:text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ollama GitHub Repository
                </Button>
                <Button
                  onClick={() => window.open('https://discord.gg/ollama', '_blank')}
                  variant="outline"
                  className="w-full justify-start border-2 border-black hover:bg-black hover:text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Join Ollama Discord
                </Button>
              </div>
            </Card>

            {/* System Info */}
            <Card className="p-6 border-4 border-black bg-white">
              <h3 className="text-xl font-bold text-black mb-4">System Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">App Version:</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ollama API:</span>
                  <span className="font-mono">localhost:11434</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Browser:</span>
                  <span className="font-mono">{navigator.userAgent.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span className="font-mono">{navigator.platform}</span>
                </div>
              </div>
            </Card>

            {/* Resources */}
            <Card className="p-6 border-4 border-black bg-white lg:col-span-2">
              <h3 className="text-xl font-bold text-black mb-4">Additional Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-black mb-2">Video Tutorials</h4>
                  <p className="text-sm text-gray-600">Watch step-by-step guides on YouTube</p>
                  <Button
                    onClick={() => window.open('https://youtube.com/search?q=ollama+tutorial', '_blank')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-2 border-black hover:bg-black hover:text-white"
                  >
                    Watch Now
                  </Button>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-black mb-2">Model Library</h4>
                  <p className="text-sm text-gray-600">Browse available models and examples</p>
                  <Button
                    onClick={() => window.open('https://ollama.com/library', '_blank')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-2 border-black hover:bg-black hover:text-white"
                  >
                    Explore
                  </Button>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-black mb-2">Community</h4>
                  <p className="text-sm text-gray-600">Connect with other Ollama users</p>
                  <Button
                    onClick={() => window.open('https://reddit.com/r/ollama', '_blank')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-2 border-black hover:bg-black hover:text-white"
                  >
                    Join Discussion
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}