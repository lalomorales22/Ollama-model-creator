import React, { useState, useEffect } from 'react';
import { ModelFile } from '@/types/ollama';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download,
  Eye,
  Settings,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { modelFileService } from '@/services/modelfiles';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export function ModelFiles() {
  const [modelFiles, setModelFiles] = useState<ModelFile[]>([]);
  const [filteredModelFiles, setFilteredModelFiles] = useState<ModelFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModelFile, setSelectedModelFile] = useState<ModelFile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModelFile, setEditingModelFile] = useState<ModelFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadModelFiles();
  }, []);

  useEffect(() => {
    const filtered = modelFiles.filter(mf =>
      mf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mf.baseModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mf.system && mf.system.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredModelFiles(filtered);
  }, [modelFiles, searchTerm]);

  const loadModelFiles = async () => {
    try {
      setIsLoading(true);
      const files = await modelFileService.getModelFiles();
      setModelFiles(files);
    } catch (error) {
      toast({
        title: "Error loading ModelFiles",
        description: "Failed to load your ModelFiles collection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (modelFile: ModelFile) => {
    setSelectedModelFile(modelFile);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (modelFile: ModelFile) => {
    setEditingModelFile({ ...modelFile });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingModelFile) return;

    try {
      await modelFileService.updateModelFile(editingModelFile.id, editingModelFile);
      toast({
        title: "ModelFile updated",
        description: `"${editingModelFile.name}" has been updated successfully.`,
      });
      setIsEditDialogOpen(false);
      setEditingModelFile(null);
      loadModelFiles();
    } catch (error) {
      toast({
        title: "Error updating ModelFile",
        description: "Failed to update the ModelFile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (modelFile: ModelFile) => {
    if (!window.confirm(`Are you sure you want to delete "${modelFile.name}"?`)) {
      return;
    }

    try {
      await modelFileService.deleteModelFile(modelFile.id);
      toast({
        title: "ModelFile deleted",
        description: `"${modelFile.name}" has been deleted.`,
      });
      loadModelFiles();
    } catch (error) {
      toast({
        title: "Error deleting ModelFile",
        description: "Failed to delete the ModelFile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (modelFile: ModelFile) => {
    const newName = prompt(`Enter name for copy of "${modelFile.name}":`);
    if (!newName) return;

    try {
      await modelFileService.duplicateModelFile(modelFile.id, newName);
      toast({
        title: "ModelFile duplicated",
        description: `Created copy as "${newName}".`,
      });
      loadModelFiles();
    } catch (error) {
      toast({
        title: "Error duplicating ModelFile",
        description: "Failed to duplicate the ModelFile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (modelFile: ModelFile) => {
    const blob = new Blob([modelFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modelFile.name}.modelfile`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "ModelFile downloaded",
      description: `"${modelFile.name}" has been downloaded.`,
    });
  };

  const handleUseForModel = (modelFile: ModelFile) => {
    // Navigate to create model page with pre-filled data
    navigate('/create', { state: { modelFile } });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">ModelFiles</h1>
          <p className="text-gray-600">Loading your ModelFiles collection...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 border-4 border-black bg-white animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">ModelFiles</h1>
          <p className="text-gray-600">Manage your collection of custom ModelFiles</p>
        </div>
        <Button
          onClick={() => navigate('/assistant')}
          className="bg-black text-white hover:bg-gray-800 border-2 border-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New ModelFile
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 border-4 border-black bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search ModelFiles by name, base model, or system prompt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-black"
          />
        </div>
      </Card>

      {/* ModelFiles Grid */}
      {filteredModelFiles.length === 0 ? (
        <Card className="p-8 border-4 border-black bg-white text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black">No ModelFiles Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'No ModelFiles match your search criteria.' 
                : 'Start by creating your first ModelFile using the AI Assistant.'}
            </p>
            <Button
              onClick={() => navigate('/assistant')}
              className="bg-black text-white hover:bg-gray-800 border-2 border-black"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Your First ModelFile
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModelFiles.map((modelFile) => (
            <Card key={modelFile.id} className="p-6 border-4 border-black bg-white hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">{modelFile.name}</h3>
                      <Badge variant="outline" className="border-black text-xs">
                        {modelFile.baseModel}
                      </Badge>
                    </div>
                  </div>
                </div>

                {modelFile.system && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {modelFile.system}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatDate(modelFile.createdAt)}</span>
                  {modelFile.updatedAt !== modelFile.createdAt && (
                    <span>Updated: {formatDate(modelFile.updatedAt)}</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleView(modelFile)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2 border-black hover:bg-black hover:text-white"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleUseForModel(modelFile)}
                    size="sm"
                    className="flex-1 bg-black text-white hover:bg-gray-800 border-2 border-black"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Use
                  </Button>
                </div>

                <div className="flex space-x-1">
                  <Button
                    onClick={() => handleEdit(modelFile)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2 border-black hover:bg-black hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDuplicate(modelFile)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2 border-black hover:bg-black hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDownload(modelFile)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2 border-black hover:bg-black hover:text-white"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(modelFile)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-2 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              {selectedModelFile?.name}
            </DialogTitle>
            <DialogDescription>
              Base Model: {selectedModelFile?.baseModel} • Created: {selectedModelFile && formatDate(selectedModelFile.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={selectedModelFile?.content || ''}
              readOnly
              className="min-h-[400px] border-2 border-black font-mono text-sm bg-gray-50"
            />
            <div className="flex space-x-2">
              <Button
                onClick={() => selectedModelFile && handleDownload(selectedModelFile)}
                variant="outline"
                className="border-2 border-black hover:bg-black hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => selectedModelFile && handleUseForModel(selectedModelFile)}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                <Settings className="w-4 h-4 mr-2" />
                Use for Model Creation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Edit ModelFile
            </DialogTitle>
            <DialogDescription>
              Make changes to your ModelFile configuration
            </DialogDescription>
          </DialogHeader>
          {editingModelFile && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-black">Name</label>
                <Input
                  value={editingModelFile.name}
                  onChange={(e) => setEditingModelFile({ ...editingModelFile, name: e.target.value })}
                  className="border-2 border-black"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-black">ModelFile Content</label>
                <Textarea
                  value={editingModelFile.content}
                  onChange={(e) => setEditingModelFile({ ...editingModelFile, content: e.target.value })}
                  className="min-h-[300px] border-2 border-black font-mono text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="border-2 border-black hover:bg-black hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}