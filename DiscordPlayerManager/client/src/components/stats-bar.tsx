import { Users, Wifi, Activity, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ServerStats } from '@shared/schema';

interface StatsBarProps {
  stats?: ServerStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const statCards = [
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: Users,
      color: 'primary',
      testId: 'stat-total-members'
    },
    {
      title: 'Online Now',
      value: stats?.onlineMembers || 0,
      icon: Wifi,
      color: 'green-500',
      testId: 'stat-online-members'
    },
    {
      title: 'Active Today',
      value: stats?.activeToday || 0,
      icon: Activity,
      color: 'blue-400',
      testId: 'stat-active-today'
    },
    {
      title: 'Recent Kicks',
      value: stats?.recentKicks || 0,
      icon: UserX,
      color: 'destructive',
      testId: 'stat-recent-kicks'
    }
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        const isGreen = stat.color === 'green-500';
        const isBlue = stat.color === 'blue-400';
        const isDestructive = stat.color === 'destructive';
        
        return (
          <motion.div 
            key={stat.testId}
            className="bg-card rounded-xl p-6 border border-border" 
            data-testid={stat.testId}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -5,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                >
                  {stat.title}
                </motion.p>
                <motion.p 
                  className={`text-2xl font-bold ${
                    isGreen ? 'text-green-500' : 
                    isBlue ? 'text-blue-400' : 
                    isDestructive ? 'text-destructive' : ''
                  }`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1 + 0.3,
                    ease: "backOut"
                  }}
                >
                  {stat.value}
                </motion.p>
              </div>
              <motion.div 
                className={`w-12 h-12 ${
                  isGreen ? 'bg-green-500/10' : 
                  isBlue ? 'bg-blue-400/10' : 
                  isDestructive ? 'bg-destructive/10' : 'bg-primary/10'
                } rounded-lg flex items-center justify-center`}
                initial={{ opacity: 0, rotate: -180, scale: 0 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1 + 0.4,
                  ease: "backOut"
                }}
                whileHover={{ 
                  rotate: 360,
                  scale: 1.1,
                  transition: {
                    rotate: { duration: 0.5 },
                    scale: { duration: 0.2 }
                  }
                }}
              >
                <IconComponent 
                  className={`w-6 h-6 ${
                    isGreen ? 'text-green-500' : 
                    isBlue ? 'text-blue-400' : 
                    isDestructive ? 'text-destructive' : 'text-primary'
                  }`} 
                />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
