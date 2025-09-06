import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import type { DiscordMember } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface KickModalProps {
  member: DiscordMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function KickModal({ member, isOpen, onClose }: KickModalProps) {
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const kickMutation = useMutation({
    mutationFn: async (data: { memberId: string; reason?: string }) => {
      const response = await apiRequest('POST', `/api/members/${data.memberId}/kick`, { reason: data.reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${member?.displayName} has been kicked from the server.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onClose();
      setReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to kick member. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleKick = () => {
    if (!member) return;
    kickMutation.mutate({ memberId: member.id, reason: reason.trim() || undefined });
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="kick-modal">
      <div className="bg-card rounded-xl p-6 max-w-md w-full border border-border animate-scale-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Kick Member</h3>
          <p className="text-muted-foreground mb-4">
            Are you sure you want to kick <span className="font-medium text-foreground" data-testid="kick-member-name">{member.displayName}</span> from the server?
          </p>
          
          {/* Reason Input */}
          <div className="mb-6 text-left">
            <label htmlFor="kick-reason" className="block text-sm font-medium mb-2">
              Reason (optional)
            </label>
            <textarea
              id="kick-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for kicking this member..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
              data-testid="kick-reason-input"
            />
            <p className="text-xs text-muted-foreground mt-1">{reason.length}/500 characters</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={kickMutation.isPending}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              data-testid="kick-cancel-button"
            >
              Cancel
            </button>
            <button 
              onClick={handleKick}
              disabled={kickMutation.isPending}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              data-testid="kick-confirm-button"
            >
              {kickMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Kick Member'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
