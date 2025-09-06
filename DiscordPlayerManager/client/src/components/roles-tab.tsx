import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DiscordPermissionsSelector from './discord-permissions-selector';

interface ServerRole {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions?: string[];
}

export default function RolesTab() {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#99AAB5');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading } = useQuery<ServerRole[]>({
    queryKey: ['/api/roles']
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; permissions?: string[] }) => {
      const response = await apiRequest('POST', '/api/roles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setNewRoleName('');
      setNewRoleColor('#99AAB5');
      setSelectedPermissions([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create role. Check your bot permissions.",
        variant: "destructive",
      });
    }
  });

  const handleCreateRole = () => {
    const trimmedName = newRoleName.trim();
    if (trimmedName && !roles.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
      createRoleMutation.mutate({
        name: trimmedName,
        color: newRoleColor,
        permissions: selectedPermissions.length > 0 ? selectedPermissions : undefined
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateRole();
    }
  };

  const predefinedColors = [
    '#99AAB5', // Default Gray
    '#7289DA', // Blurple
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FECA57', // Yellow
    '#FF9FF3', // Pink
    '#F38BA8', // Rose
    '#A8E6CF'  // Mint
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-lg"></div>
        <div className="skeleton h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6" 
      data-testid="roles-tab"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.div 
        className="bg-card rounded-xl p-6 border border-border"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.div 
          className="flex items-center space-x-3 mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Crown className="w-6 h-6 text-yellow-500" />
          </motion.div>
          <h2 className="text-xl font-bold">Role Management</h2>
        </motion.div>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Create and manage server roles. Currently {roles.length} roles configured.
        </motion.p>
      </motion.div>

      {/* Create Role Section */}
      <motion.div 
        className="bg-card rounded-xl p-6 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        whileHover={{ scale: 1.01 }}
      >
        <motion.h3 
          className="text-lg font-semibold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Create New Role
        </motion.h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Role Name</label>
            <motion.input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter role name..."
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              disabled={createRoleMutation.isPending}
              data-testid="new-role-name-input"
              maxLength={100}
              whileFocus={{ scale: 1.02, borderColor: 'hsl(var(--primary))' }}
              transition={{ duration: 0.2 }}
            />
            {newRoleName.trim() && roles.some(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase()) && (
              <p className="text-orange-500 text-sm mt-1">A role with this name already exists</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Role Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={newRoleColor}
                onChange={(e) => setNewRoleColor(e.target.value)}
                className="w-12 h-10 border border-border rounded-lg cursor-pointer"
                data-testid="new-role-color-input"
              />
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map((color, index) => (
                  <motion.button
                    key={color}
                    onClick={() => setNewRoleColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newRoleColor === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    data-testid={`color-${color}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: newRoleColor === color ? 1.1 : 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Discord Permissions</label>
            <DiscordPermissionsSelector
              selectedPermissions={selectedPermissions}
              onPermissionsChange={setSelectedPermissions}
              disabled={createRoleMutation.isPending}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div 
              className="px-3 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: newRoleColor + '20',
                color: newRoleColor,
                border: `1px solid ${newRoleColor}40`
              }}
            >
              {newRoleName.trim() || 'Role Preview'}
            </div>
            <motion.button
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || createRoleMutation.isPending || roles.some(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase())}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              data-testid="create-role-button"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {createRoleMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: [0, 90, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                  </motion.div>
                  Create Role
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Existing Roles */}
      <motion.div 
        className="bg-card rounded-xl p-6 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <motion.h3 
          className="text-lg font-semibold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          Server Roles
        </motion.h3>
        
        <AnimatePresence mode="wait">
          {roles.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              </motion.div>
              <motion.h4 
                className="text-lg font-medium text-muted-foreground mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                No Roles Found
              </motion.h4>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Create your first role above to start organizing your server.
              </motion.p>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
              data-testid="roles-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  className="bg-background border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  data-testid={`role-${role.id}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.7 + (index * 0.1),
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    borderColor: 'hsl(var(--primary))'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <motion.div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                      animate={{ 
                        boxShadow: [`0 0 0 0 ${role.color}40`, `0 0 0 8px ${role.color}00`, `0 0 0 0 ${role.color}40`]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.span 
                      className="text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.8 + (index * 0.1) }}
                    >
                      #{role.position}
                    </motion.span>
                  </div>
                  <motion.h4 
                    className="font-medium text-foreground mb-1" 
                    data-testid={`role-name-${role.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 + (index * 0.1) }}
                  >
                    {role.name}
                  </motion.h4>
                  <motion.p 
                    className="text-xs text-muted-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.0 + (index * 0.1) }}
                  >
                    Color: {role.color}
                  </motion.p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}