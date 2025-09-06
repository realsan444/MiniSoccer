import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DiscordMember } from '@shared/schema';

interface MemberCardProps {
  member: DiscordMember;
  onManage: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'status-online';
    case 'idle': return 'status-idle';
    case 'dnd': return 'status-dnd';
    case 'offline': 
    default: return 'status-offline';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'online': return 'Online';
    case 'idle': return 'Idle';
    case 'dnd': return 'Do Not Disturb';
    case 'offline': 
    default: return 'Offline';
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'online': return 'text-green-500';
    case 'idle': return 'text-orange-500';
    case 'dnd': return 'text-red-500';
    case 'offline': 
    default: return 'text-gray-500';
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'Admin': return 'bg-red-500/10 text-red-500';
    case 'Moderator': return 'bg-orange-500/10 text-orange-500';
    case 'Member': 
    default: return 'bg-primary/10 text-primary';
  }
};

const getAvatarUrl = (member: DiscordMember) => {
  if (member.avatar) {
    return `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=128`;
  }
  // Default avatar based on discriminator
  const defaultAvatarId = member.discriminator ? parseInt(member.discriminator) % 5 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarId}.png`;
};

export default function MemberCard({ member, onManage }: MemberCardProps) {
  return (
    <motion.div 
      className="member-card bg-card rounded-xl p-4 border border-border relative overflow-hidden group" 
      data-testid={`member-card-${member.id}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.03, 
        y: -5,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        borderColor: 'hsl(var(--primary))'
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative">
        {/* Profile Image with Status */}
        <div className="relative w-16 h-16 mx-auto mb-3">
          <motion.img 
            src={getAvatarUrl(member)}
            alt={`${member.displayName} profile picture`}
            className={`w-full h-full rounded-full object-cover ${member.status === 'offline' ? 'grayscale' : ''}`}
            data-testid={`avatar-${member.id}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          />
          <motion.div 
            className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(member.status)} status-indicator rounded-full border-2 border-card`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: member.status === 'online' ? [1, 1.2, 1] : 1,
              boxShadow: member.status === 'online' ? [
                '0 0 0 0 rgba(34, 197, 94, 0.7)',
                '0 0 0 8px rgba(34, 197, 94, 0)',
                '0 0 0 0 rgba(34, 197, 94, 0.7)'
              ] : undefined
            }}
            transition={{
              opacity: { duration: 0.4, delay: 0.2, ease: "backOut" },
              scale: member.status === 'online' ? { duration: 2, repeat: Infinity } : { duration: 0.4, delay: 0.2, ease: "backOut" },
              boxShadow: { duration: 2, repeat: Infinity }
            }}
          ></motion.div>
        </div>
        
        {/* Member Info */}
        <div className="text-center">
          <motion.h3 
            className={`font-semibold text-sm mb-1 ${member.status === 'offline' ? 'opacity-60' : ''}`} 
            data-testid={`name-${member.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {member.displayName}
          </motion.h3>
          <motion.p 
            className="text-xs text-muted-foreground mb-2" 
            data-testid={`username-${member.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            @{member.username}
          </motion.p>
          <motion.div 
            className={`inline-flex items-center px-2 py-1 ${getStatusColor(member.status)}/10 rounded-full`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "backOut" }}
            whileHover={{ scale: 1.1 }}
          >
            <span className={`text-xs font-medium ${getStatusTextColor(member.status)}`} data-testid={`status-${member.id}`}>
              {getStatusText(member.status)}
            </span>
          </motion.div>
        </div>
        
        {/* Role Badge */}
        <div className={`absolute top-0 right-0 ${getRoleBadgeColor(member.role)} px-2 py-1 rounded-bl-lg rounded-tr-xl text-xs font-medium`} data-testid={`role-${member.id}`}>
          {member.role}
        </div>
        
        {/* Management Overlay */}
        <div className="kick-overlay absolute inset-0 bg-primary/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <button 
            onClick={onManage}
            className="bg-white text-primary px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            data-testid={`manage-button-${member.id}`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Manage Member
          </button>
        </div>
      </div>
    </motion.div>
  );
}
