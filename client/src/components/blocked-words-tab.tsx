import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Shield } from 'lucide-react';
import type { BlockedWord } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function BlockedWordsTab() {
  const [newWord, setNewWord] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blockedWords = [], isLoading } = useQuery<BlockedWord[]>({
    queryKey: ['/api/blocked-words']
  });

  const addWordMutation = useMutation({
    mutationFn: async (word: string) => {
      const response = await apiRequest('POST', '/api/blocked-words', {
        word: word.toLowerCase().trim(),
        createdBy: 'admin'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blocked word added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-words'] });
      setNewWord('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add blocked word.",
        variant: "destructive",
      });
    }
  });

  const removeWordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/blocked-words/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blocked word removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-words'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove blocked word.",
        variant: "destructive",
      });
    }
  });

  const handleAddWord = () => {
    const trimmedWord = newWord.trim();
    if (trimmedWord && !blockedWords.some(w => w.word === trimmedWord.toLowerCase())) {
      addWordMutation.mutate(trimmedWord);
    }
  };

  const handleRemoveWord = (id: string) => {
    removeWordMutation.mutate(id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-lg"></div>
        <div className="skeleton h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="blocked-words-tab">
      {/* Header */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold">Blocked Words Management</h2>
        </div>
        <p className="text-muted-foreground">
          Manage words that are automatically filtered from chat messages. Currently {blockedWords.length} words blocked.
        </p>
      </div>

      {/* Add Word Section */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-4">Add New Blocked Word</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter word to block..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={addWordMutation.isPending}
            data-testid="new-word-input"
          />
          <button
            onClick={handleAddWord}
            disabled={!newWord.trim() || addWordMutation.isPending || blockedWords.some(w => w.word === newWord.trim().toLowerCase())}
            className="bg-red-500 hover:bg-red-500/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            data-testid="add-word-button"
          >
            {addWordMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Block Word
              </>
            )}
          </button>
        </div>
        {newWord.trim() && blockedWords.some(w => w.word === newWord.trim().toLowerCase()) && (
          <p className="text-orange-500 text-sm mt-2">This word is already blocked</p>
        )}
      </div>

      {/* Blocked Words List */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-4">Current Blocked Words</h3>
        
        {blockedWords.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-muted-foreground mb-2">No Blocked Words</h4>
            <p className="text-muted-foreground">Add words above to start filtering chat messages.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" data-testid="blocked-words-list">
            {blockedWords.map((blockedWord) => (
              <div
                key={blockedWord.id}
                className="bg-background border border-border rounded-lg p-4 flex items-center justify-between group hover:border-red-500/50 transition-colors"
                data-testid={`blocked-word-${blockedWord.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate" data-testid={`word-text-${blockedWord.id}`}>
                    {blockedWord.word}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(blockedWord.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveWord(blockedWord.id)}
                  disabled={removeWordMutation.isPending}
                  className="ml-3 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  data-testid={`remove-word-${blockedWord.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}