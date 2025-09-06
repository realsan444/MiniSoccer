import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Calendar, 
  UserX, 
  Ban, 
  Shield, 
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import type { DiscordMember } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MemberModalProps {
  member: DiscordMember | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ServerRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

const getAvatarUrl = (member: DiscordMember) => {
  if (member.avatar) {
    return `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=128`;
  }
  const defaultAvatarId = member.discriminator ? parseInt(member.discriminator) % 5 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarId}.png`;
};

const formatDate = (date: Date | string | null) => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function MemberModal({ member, isOpen, onClose }: MemberModalProps) {
  const [activeAction, setActiveAction] = useState<'kick' | 'ban' | null>(null);
  const [reason, setReason] = useState('');
  const [sendInvite, setSendInvite] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch server roles
  const { data: serverRoles = [] } = useQuery<ServerRole[]>({
    queryKey: ['/api/roles'],
    enabled: isOpen && !!member
  });

  const kickMutation = useMutation({
    mutationFn: async (data: { reason?: string; sendInvite: boolean }) => {
      const response = await apiRequest('POST', `/api/members/${member?.id}/kick`, data);
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
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to kick member. Please try again.",
        variant: "destructive",
      });
    }
  });

  const banMutation = useMutation({
    mutationFn: async (data: { reason?: string; sendInvite: boolean }) => {
      const response = await apiRequest('POST', `/api/members/${member?.id}/ban`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${member?.displayName} has been banned from the server.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to ban member. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiRequest('POST', `/api/members/${member?.id}/roles`, { roleId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setSelectedRole('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add role.",
        variant: "destructive",
      });
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await apiRequest('DELETE', `/api/members/${member?.id}/roles/${roleId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove role.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setActiveAction(null);
    setReason('');
    setSendInvite(false);
    setSelectedRole('');
  };

  const handleKick = () => {
    kickMutation.mutate({ 
      reason: reason.trim() || undefined, 
      sendInvite 
    });
  };

  const handleBan = () => {
    banMutation.mutate({ 
      reason: reason.trim() || undefined, 
      sendInvite 
    });
  };

  const handleAddRole = () => {
    if (selectedRole && member) {
      addRoleMutation.mutate(selectedRole);
    }
  };

  const handleRemoveRole = (roleId: string) => {
    removeRoleMutation.mutate(roleId);
  };

  const getRoleName = (roleId: string) => {
    const role = serverRoles.find(r => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  const getRoleColor = (roleId: string) => {
    const role = serverRoles.find(r => r.id === roleId);
    return role?.color || '#99AAB5';
  };

  const availableRoles = serverRoles.filter(role => 
    !member?.roles?.includes(role.id)
  );

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="member-modal">
      <div className="bg-card rounded-xl p-6 max-w-2xl w-full border border-border animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <img 
              src={getAvatarUrl(member)}
              alt={`${member.displayName} avatar`}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-xl font-bold" data-testid="member-modal-name">{member.displayName}</h2>
              <p className="text-muted-foreground">@{member.username}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="member-modal-close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Member Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Joined Server</span>
              </div>
              <p className="text-foreground" data-testid="joined-server-date">
                {formatDate(member.joinedServerAt)}
              </p>
            </div>
            
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Joined Discord</span>
              </div>
              <p className="text-foreground" data-testid="joined-discord-date">
                {formatDate(member.joinedDiscordAt)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Roles</span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto" data-testid="current-roles">
                {member.roles && member.roles.length > 0 ? (
                  member.roles.map(roleId => (
                    <div 
                      key={roleId} 
                      className="flex items-center justify-between bg-muted rounded px-3 py-2"
                      style={{ borderLeft: `4px solid ${getRoleColor(roleId)}` }}
                    >
                      <span className="text-sm font-medium" data-testid={`role-${roleId}`}>
                        {getRoleName(roleId)}
                      </span>
                      <button
                        onClick={() => handleRemoveRole(roleId)}
                        disabled={removeRoleMutation.isPending}
                        className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                        data-testid={`remove-role-${roleId}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No roles assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Role Section */}
        <div className="bg-background rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Add Role</span>
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex-1 px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="role-select"
            >
              <option value="">Select a role...</option>
              {availableRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddRole}
              disabled={!selectedRole || addRoleMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              data-testid="add-role-button"
            >
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {!activeAction && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveAction('kick')}
              className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              data-testid="kick-action-button"
            >
              <UserX className="w-4 h-4 mr-2" />
              Kick Member
            </button>
            <button
              onClick={() => setActiveAction('ban')}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-500 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              data-testid="ban-action-button"
            >
              <Ban className="w-4 h-4 mr-2" />
              Ban Member
            </button>
          </div>
        )}

        {/* Action Form */}
        {activeAction && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {activeAction === 'kick' ? 'Kick Member' : 'Ban Member'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter reason for ${activeAction}ing this member...`}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                maxLength={500}
                data-testid="action-reason-input"
              />
              <p className="text-xs text-muted-foreground mt-1">{reason.length}/500 characters</p>
            </div>

            <div className="flex items-center justify-between bg-background rounded-lg p-3">
              <div>
                <p className="font-medium">Send Server Invite?</p>
                <p className="text-sm text-muted-foreground">
                  Include a server invite link in the message
                </p>
              </div>
              <button
                onClick={() => setSendInvite(!sendInvite)}
                className={`transition-colors ${sendInvite ? 'text-primary' : 'text-muted-foreground'}`}
                data-testid="send-invite-toggle"
              >
                {sendInvite ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveAction(null)}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-lg font-medium transition-colors"
                data-testid="action-cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={activeAction === 'kick' ? handleKick : handleBan}
                disabled={kickMutation.isPending || banMutation.isPending}
                className={`flex-1 ${
                  activeAction === 'kick' 
                    ? 'bg-orange-500 hover:bg-orange-500/90' 
                    : 'bg-red-500 hover:bg-red-500/90'
                } text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center`}
                data-testid="action-confirm-button"
              >
                {(kickMutation.isPending || banMutation.isPending) ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {activeAction === 'kick' ? <UserX className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                    {activeAction === 'kick' ? 'Kick Member' : 'Ban Member'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}