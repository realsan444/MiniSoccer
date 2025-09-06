import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, Minus, Edit3 } from 'lucide-react';
import type { DiscordMember } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CashMemberCardProps {
  member: DiscordMember;
}

const getAvatarUrl = (member: DiscordMember) => {
  if (member.avatar) {
    return `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=64`;
  }
  const defaultAvatarId = member.discriminator ? parseInt(member.discriminator) % 5 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarId}.png`;
};

export default function CashMemberCard({ member }: CashMemberCardProps) {
  const [showManagement, setShowManagement] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setCashMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('PUT', `/api/members/${member.id}/cash`, { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cash/total'] });
      setIsInputMode(false);
      setInputAmount('');
      toast({
        title: "Success",
        description: `Set ${member.displayName}'s cash to $${inputAmount}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cash",
        variant: "destructive",
      });
    }
  });

  const addCashMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', `/api/members/${member.id}/cash/add`, { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cash/total'] });
      toast({
        title: "Success",
        description: `${inputAmount.startsWith('-') ? 'Removed' : 'Added'} $${Math.abs(parseInt(inputAmount))} ${inputAmount.startsWith('-') ? 'from' : 'to'} ${member.displayName}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to modify cash",
        variant: "destructive",
      });
    }
  });

  const handleQuickAdd = (amount: number) => {
    addCashMutation.mutate(amount);
  };

  const handleSetCash = () => {
    const amount = parseInt(inputAmount);
    if (!isNaN(amount) && amount >= 0) {
      setCashMutation.mutate(amount);
    }
  };

  const handleAddCash = () => {
    const amount = parseInt(inputAmount);
    if (!isNaN(amount)) {
      addCashMutation.mutate(amount);
    }
  };

  return (
    <div 
      className="bg-card rounded-lg p-3 border border-border relative group transition-all hover:scale-105 hover:shadow-lg"
      onMouseEnter={() => setShowManagement(true)}
      onMouseLeave={() => {
        setShowManagement(false);
        setIsInputMode(false);
        setInputAmount('');
      }}
      data-testid={`cash-card-${member.id}`}
    >
      {/* Member Avatar and Info */}
      <div className="text-center">
        <img 
          src={getAvatarUrl(member)}
          alt={`${member.displayName} avatar`}
          className="w-12 h-12 rounded-full mx-auto mb-2"
          data-testid={`cash-avatar-${member.id}`}
        />
        <h3 className="text-xs font-medium truncate mb-1" data-testid={`cash-name-${member.id}`}>
          {member.displayName}
        </h3>
        <div className="flex items-center justify-center text-sm font-bold text-green-500" data-testid={`cash-amount-${member.id}`}>
          <DollarSign className="w-3 h-3 mr-1" />
          {member.cash.toLocaleString()}
        </div>
      </div>

      {/* Cash Management Overlay */}
      {showManagement && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-3 animate-scale-in">
          {!isInputMode ? (
            <div className="space-y-2 w-full">
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => handleQuickAdd(100)}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-500 px-2 py-1 rounded text-xs font-medium transition-colors"
                  data-testid={`add-100-${member.id}`}
                >
                  +$100
                </button>
                <button
                  onClick={() => handleQuickAdd(500)}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-500 px-2 py-1 rounded text-xs font-medium transition-colors"
                  data-testid={`add-500-${member.id}`}
                >
                  +$500
                </button>
                <button
                  onClick={() => handleQuickAdd(-100)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-500 px-2 py-1 rounded text-xs font-medium transition-colors"
                  data-testid={`remove-100-${member.id}`}
                >
                  -$100
                </button>
              </div>
              
              {/* Custom Amount Button */}
              <button
                onClick={() => setIsInputMode(true)}
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center"
                data-testid={`custom-amount-${member.id}`}
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Custom Amount
              </button>
            </div>
          ) : (
            <div className="space-y-2 w-full">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-2 py-1 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                data-testid={`cash-input-${member.id}`}
              />
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={handleSetCash}
                  disabled={setCashMutation.isPending}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                  data-testid={`set-cash-${member.id}`}
                >
                  Set
                </button>
                <button
                  onClick={handleAddCash}
                  disabled={addCashMutation.isPending}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-500 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                  data-testid={`add-cash-${member.id}`}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}