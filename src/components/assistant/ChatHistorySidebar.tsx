import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { useUIStore } from '@/stores/ui-store';
import { useToast } from '@/hooks/use-toast';

interface ChatHistorySidebarProps {
  onNewChat: () => void;
}

const sidebarVariants = {
  open: { 
    width: 280, 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
  closed: { 
    width: 0, 
    opacity: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
};

export function ChatHistorySidebar({ onNewChat }: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { chatSidebarOpen, toggleChatSidebar } = useUIStore();
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversation,
    deleteConversation,
    renameConversation,
    clearAllConversations
  } = useChatStore();

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      // Search in title
      if (conv.title.toLowerCase().includes(query)) return true;
      // Search in messages
      return conv.messages.some(msg => 
        msg.content.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: typeof conversations } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt);
      
      if (convDate >= today) {
        groups['Today'].push(conv);
      } else if (convDate >= yesterday) {
        groups['Yesterday'].push(conv);
      } else if (convDate >= weekAgo) {
        groups['This Week'].push(conv);
      } else if (convDate >= monthAgo) {
        groups['This Month'].push(conv);
      } else {
        groups['Older'].push(conv);
      }
    });

    return groups;
  }, [filteredConversations]);

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
      toast({ title: 'Conversation renamed' });
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string) => {
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete);
      toast({ title: 'Conversation deleted' });
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleExport = (conversation: typeof conversations[0]) => {
    // Export as JSON
    const exportData = {
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Conversation exported' });
  };

  const handleExportMarkdown = (conversation: typeof conversations[0]) => {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Model:** ${conversation.model}\n`;
    markdown += `**Date:** ${new Date(conversation.createdAt).toLocaleDateString()}\n\n`;
    markdown += `---\n\n`;

    conversation.messages.forEach(msg => {
      const role = msg.role === 'user' ? '**You:**' : '**Assistant:**';
      markdown += `${role}\n\n${msg.content}\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Exported as Markdown' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Toggle button when closed */}
      {!chatSidebarOpen && (
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleChatSidebar}
            className="h-full rounded-lg border-2 border-gray-200 dark:border-gray-700 px-1"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {chatSidebarOpen && (
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="h-full border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 flex flex-col overflow-hidden flex-shrink-0"
          >
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold dark:text-white text-sm">Chat History</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChatSidebar}
                  className="w-8 h-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                onClick={onNewChat}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 mb-3"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="pl-8 h-8 text-sm border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {Object.entries(groupedConversations).map(([group, convs]) => {
                  if (convs.length === 0) return null;
                  
                  return (
                    <div key={group} className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-2">
                        {group}
                      </h4>
                      <div className="space-y-1">
                        {convs.map((conv) => (
                          <motion.div
                            key={conv.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "group rounded-lg transition-colors cursor-pointer",
                              activeConversationId === conv.id
                                ? "bg-black dark:bg-white text-white dark:text-black"
                                : "hover:bg-gray-200 dark:hover:bg-gray-800"
                            )}
                          >
                            {editingId === conv.id ? (
                              <div className="flex items-center gap-1 p-2">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="h-6 text-sm px-2"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(conv.id);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-6 h-6 p-0"
                                  onClick={() => handleSaveEdit(conv.id)}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-6 h-6 p-0"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="flex items-center justify-between p-2"
                                onClick={() => setActiveConversation(conv.id)}
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                  <div className="overflow-hidden">
                                    <p className="text-sm font-medium truncate">
                                      {conv.title}
                                    </p>
                                    <p className={cn(
                                      "text-xs truncate",
                                      activeConversationId === conv.id
                                        ? "text-gray-300 dark:text-gray-600"
                                        : "text-gray-500 dark:text-gray-400"
                                    )}>
                                      {conv.messages.length} messages • {formatDate(conv.updatedAt)}
                                    </p>
                                  </div>
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                        activeConversationId === conv.id && "text-white dark:text-black"
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStartEdit(conv.id, conv.title)}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport(conv)}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Export JSON
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportMarkdown(conv)}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Export Markdown
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(conv.id)}
                                      className="text-red-600 dark:text-red-400"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filteredConversations.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {searchQuery ? (
                      <>
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No chats found</p>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs mt-1">Start a new chat to begin</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            {conversations.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    clearAllConversations();
                    toast({ title: 'All conversations deleted' });
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Chats
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This conversation and all its messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
