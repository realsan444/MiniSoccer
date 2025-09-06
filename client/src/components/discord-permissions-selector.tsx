import { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscordPermission {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'text' | 'voice' | 'advanced';
}

const DISCORD_PERMISSIONS: DiscordPermission[] = [
  // General Permissions
  { id: 'Administrator', name: 'Administrator', description: 'All permissions', category: 'general' },
  { id: 'ViewChannel', name: 'View Channels', description: 'View channels', category: 'general' },
  { id: 'ManageChannels', name: 'Manage Channels', description: 'Create, edit, and delete channels', category: 'general' },
  { id: 'ManageRoles', name: 'Manage Roles', description: 'Create, edit, and delete roles', category: 'general' },
  { id: 'ManageEmojisAndStickers', name: 'Manage Emojis & Stickers', description: 'Add, edit, and delete emojis and stickers', category: 'general' },
  { id: 'ViewAuditLog', name: 'View Audit Log', description: 'View audit log entries', category: 'general' },
  { id: 'ViewServerInsights', name: 'View Server Insights', description: 'View server insights and analytics', category: 'general' },
  { id: 'ManageWebhooks', name: 'Manage Webhooks', description: 'Create, edit, and delete webhooks', category: 'general' },
  { id: 'ManageServer', name: 'Manage Server', description: 'Edit server settings', category: 'general' },

  // Text Permissions
  { id: 'SendMessages', name: 'Send Messages', description: 'Send messages in text channels', category: 'text' },
  { id: 'SendMessagesInThreads', name: 'Send Messages in Threads', description: 'Send messages in threads', category: 'text' },
  { id: 'CreatePublicThreads', name: 'Create Public Threads', description: 'Create public threads', category: 'text' },
  { id: 'CreatePrivateThreads', name: 'Create Private Threads', description: 'Create private threads', category: 'text' },
  { id: 'EmbedLinks', name: 'Embed Links', description: 'Links posted will embed', category: 'text' },
  { id: 'AttachFiles', name: 'Attach Files', description: 'Upload files and media', category: 'text' },
  { id: 'AddReactions', name: 'Add Reactions', description: 'Add new reactions to messages', category: 'text' },
  { id: 'UseExternalEmojis', name: 'Use External Emojis', description: 'Use emojis from other servers', category: 'text' },
  { id: 'UseExternalStickers', name: 'Use External Stickers', description: 'Use stickers from other servers', category: 'text' },
  { id: 'MentionEveryone', name: 'Mention @everyone, @here, and All Roles', description: 'Mention @everyone, @here, and all roles', category: 'text' },
  { id: 'ManageMessages', name: 'Manage Messages', description: 'Delete and pin messages', category: 'text' },
  { id: 'ManageThreads', name: 'Manage Threads', description: 'Rename, delete, and archive threads', category: 'text' },
  { id: 'ReadMessageHistory', name: 'Read Message History', description: 'Read previous messages', category: 'text' },
  { id: 'SendTTSMessages', name: 'Send Text-to-Speech Messages', description: 'Send text-to-speech messages', category: 'text' },
  { id: 'UseSlashCommands', name: 'Use Application Commands', description: 'Use slash commands and context menus', category: 'text' },

  // Voice Permissions
  { id: 'Connect', name: 'Connect', description: 'Connect to voice channels', category: 'voice' },
  { id: 'Speak', name: 'Speak', description: 'Speak in voice channels', category: 'voice' },
  { id: 'MuteMembers', name: 'Mute Members', description: 'Mute members in voice channels', category: 'voice' },
  { id: 'DeafenMembers', name: 'Deafen Members', description: 'Deafen members in voice channels', category: 'voice' },
  { id: 'MoveMembers', name: 'Move Members', description: 'Move members between voice channels', category: 'voice' },
  { id: 'UseVAD', name: 'Use Voice Activity', description: 'Use voice activity detection', category: 'voice' },
  { id: 'PrioritySpeaker', name: 'Priority Speaker', description: 'Be heard more clearly in voice channels', category: 'voice' },
  { id: 'Stream', name: 'Video', description: 'Share video, screen share, or stream games', category: 'voice' },

  // Advanced Permissions
  { id: 'KickMembers', name: 'Kick Members', description: 'Remove members from the server', category: 'advanced' },
  { id: 'BanMembers', name: 'Ban Members', description: 'Ban members from the server', category: 'advanced' },
  { id: 'ModerateMembers', name: 'Timeout Members', description: 'Timeout members', category: 'advanced' },
  { id: 'ChangeNickname', name: 'Change Nickname', description: 'Change own nickname', category: 'advanced' },
  { id: 'ManageNicknames', name: 'Manage Nicknames', description: 'Change other members nicknames', category: 'advanced' },
  { id: 'CreateInstantInvite', name: 'Create Invite', description: 'Create server invites', category: 'advanced' },
  { id: 'RequestToSpeak', name: 'Request to Speak', description: 'Request to speak in stage channels', category: 'advanced' }
];

const CATEGORY_LABELS = {
  general: 'General Server Permissions',
  text: 'Text Channel Permissions',
  voice: 'Voice Channel Permissions',
  advanced: 'Advanced Permissions'
};

interface DiscordPermissionsSelectorProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export default function DiscordPermissionsSelector({ 
  selectedPermissions, 
  onPermissionsChange, 
  disabled = false 
}: DiscordPermissionsSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    general: true,
    text: false,
    voice: false,
    advanced: false
  });

  const togglePermission = (permissionId: string) => {
    if (disabled) return;
    
    if (permissionId === 'Administrator') {
      // If toggling Administrator, either select all or deselect all
      if (selectedPermissions.includes('Administrator')) {
        onPermissionsChange([]);
      } else {
        onPermissionsChange(['Administrator']);
      }
      return;
    }

    // If Administrator is selected and we're toggling another permission, remove Administrator
    let newPermissions = selectedPermissions.filter(p => p !== 'Administrator');
    
    if (newPermissions.includes(permissionId)) {
      newPermissions = newPermissions.filter(p => p !== permissionId);
    } else {
      newPermissions = [...newPermissions, permissionId];
    }
    
    onPermissionsChange(newPermissions);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const isPermissionSelected = (permissionId: string) => {
    return selectedPermissions.includes('Administrator') || selectedPermissions.includes(permissionId);
  };

  const isPermissionDisabled = (permissionId: string) => {
    return disabled || (selectedPermissions.includes('Administrator') && permissionId !== 'Administrator');
  };

  const categories = ['general', 'text', 'voice', 'advanced'] as const;

  return (
    <motion.div 
      className="space-y-4" 
      data-testid="discord-permissions-selector"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Select the permissions this role should have. Administrator permission grants all permissions.
      </motion.div>
      
      {categories.map((category, categoryIndex) => {
        const categoryPermissions = DISCORD_PERMISSIONS.filter(p => p.category === category);
        const isExpanded = expandedCategories[category];
        
        return (
          <motion.div 
            key={category} 
            className="border border-border rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
            whileHover={{ scale: 1.02, borderColor: 'hsl(var(--primary))' }}
          >
            <motion.button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
              data-testid={`category-${category}`}
              whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.8)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <motion.h4 
                  className="font-medium"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: categoryIndex * 0.1 + 0.1 }}
                >
                  {CATEGORY_LABELS[category]}
                </motion.h4>
                <motion.div 
                  className="text-xs text-muted-foreground w-6 h-6 flex items-center justify-center"
                  animate={{ rotate: isExpanded ? 45 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {isExpanded ? '−' : '+'}
                </motion.div>
              </div>
            </motion.button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  className="border-t border-border overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="p-4 space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    {categoryPermissions.map((permission, permIndex) => (
                      <motion.div
                        key={permission.id}
                        className={`flex items-start space-x-3 p-2 rounded transition-colors ${
                          isPermissionDisabled(permission.id) 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-muted/30 cursor-pointer'
                        }`}
                        onClick={() => togglePermission(permission.id)}
                        data-testid={`permission-${permission.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: permIndex * 0.05,
                          ease: "easeOut"
                        }}
                        whileHover={!isPermissionDisabled(permission.id) ? { 
                          scale: 1.02, 
                          x: 5,
                          backgroundColor: 'hsl(var(--muted) / 0.5)'
                        } : {}}
                        whileTap={!isPermissionDisabled(permission.id) ? { scale: 0.98 } : {}}
                      >
                        <div className="mt-0.5">
                          <AnimatePresence mode="wait">
                            {isPermissionSelected(permission.id) ? (
                              <motion.div
                                key="checked"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.3, ease: "backOut" }}
                              >
                                <CheckSquare className="w-4 h-4 text-primary" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="unchecked"
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: -180 }}
                                transition={{ duration: 0.3, ease: "backOut" }}
                              >
                                <Square className="w-4 h-4 text-muted-foreground" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex-1">
                          <motion.div 
                            className="font-medium text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: permIndex * 0.05 + 0.1 }}
                          >
                            {permission.name}
                          </motion.div>
                          <motion.div 
                            className="text-xs text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: permIndex * 0.05 + 0.2 }}
                          >
                            {permission.description}
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      
      <AnimatePresence>
        {selectedPermissions.length > 0 && (
          <motion.div 
            className="mt-4 p-3 bg-muted/30 rounded-lg"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div 
              className="text-sm font-medium mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              Selected Permissions:
            </motion.div>
            <motion.div 
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <AnimatePresence>
                {selectedPermissions.map((permissionId, index) => {
                  const permission = DISCORD_PERMISSIONS.find(p => p.id === permissionId);
                  return (
                    <motion.span
                      key={permissionId}
                      className="px-2 py-1 bg-primary/20 text-primary text-xs rounded"
                      data-testid={`selected-${permissionId}`}
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: -20 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: "backOut"
                      }}
                      whileHover={{ scale: 1.1, y: -2 }}
                    >
                      {permission?.name || permissionId}
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}