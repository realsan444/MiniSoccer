import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Users, Wifi, Activity, UserX, RefreshCw, DollarSign, Shield, Settings } from 'lucide-react';
import type { DiscordMember, ServerStats } from '@shared/schema';
import { useWebSocket } from '@/hooks/use-websocket';
import MemberCard from '@/components/member-card';
import CashMemberCard from '@/components/cash-member-card';
import StatsBar from '@/components/stats-bar';
import SearchFilters from '@/components/search-filters';
import MemberModal from '@/components/member-modal';
import BlockedWordsTab from '@/components/blocked-words-tab';
import RolesTab from '@/components/roles-tab';

export default function Dashboard() {
  const [selectedMember, setSelectedMember] = useState<DiscordMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'cash' | 'blocked' | 'roles'>('members');

  const queryClient = useQueryClient();
  const { isConnected, lastMessage } = useWebSocket();

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery<DiscordMember[]>({
    queryKey: ['/api/members'],
    refetchInterval: 30000 // Fallback polling every 30 seconds
  });

  // Fetch stats
  const { data: stats } = useQuery<ServerStats>({
    queryKey: ['/api/stats'],
    refetchInterval: 10000 // Update stats every 10 seconds
  });

  // Fetch total cash
  const { data: totalCashData } = useQuery<{ totalCash: number }>({
    queryKey: ['/api/cash/total'],
    refetchInterval: 5000 // Update total cash every 5 seconds
  });

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    const { type, data } = lastMessage;

    switch (type) {
      case 'memberJoined':
        queryClient.setQueryData(['/api/members'], (old: DiscordMember[] = []) => 
          [...old, data]
        );
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        break;

      case 'memberLeft':
        queryClient.setQueryData(['/api/members'], (old: DiscordMember[] = []) => 
          old.filter(member => member.id !== data.id)
        );
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        break;

      case 'memberStatusUpdate':
        queryClient.setQueryData(['/api/members'], (old: DiscordMember[] = []) => 
          old.map(member => member.id === data.id ? data : member)
        );
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        break;

      case 'memberKicked':
        queryClient.setQueryData(['/api/members'], (old: DiscordMember[] = []) => 
          old.filter(member => member.id !== data.id)
        );
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        break;
    }
  }, [lastMessage, queryClient]);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Show spinner for at least 1 second
    }
  };

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Discord Bot Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Member Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-2 rounded-lg" data-testid="connection-status">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 live-indicator' : 'bg-gray-500'}`}></div>
                <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              {/* Live Updates Indicator */}
              <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-lg" data-testid="live-updates">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary">Live Updates</span>
              </div>

              {/* Server Info */}
              <div className="bg-secondary/50 px-3 py-2 rounded-lg" data-testid="server-info">
                <span className="text-sm font-medium">Discord Server</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                data-testid="refresh-button"
              >
                <RefreshCw className={`w-4 h-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-primary">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Section */}
        <StatsBar stats={stats} />

        {/* Tab Navigation */}
        <div className="bg-card rounded-xl border border-border mb-8">
          <div className="flex">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-6 py-4 text-sm font-medium rounded-l-xl transition-colors ${
                activeTab === 'members' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="members-tab"
            >
              <Users className="w-4 h-4 inline mr-2" />
              Server Members
            </button>
            <button
              onClick={() => setActiveTab('cash')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'cash' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="cash-tab"
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Cash Handle
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'blocked' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="blocked-tab"
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Blocked Words
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 px-6 py-4 text-sm font-medium rounded-r-xl transition-colors ${
                activeTab === 'roles' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="roles-tab"
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Role Management
            </button>
          </div>
        </div>

        {activeTab === 'members' && (
          <>
            {/* Search and Filters */}
            <SearchFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
            />

            {/* Members Grid */}
        {membersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border" data-testid={`skeleton-card-${i}`}>
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3 skeleton"></div>
                  <div className="h-4 bg-muted rounded mb-2 skeleton"></div>
                  <div className="h-3 bg-muted rounded mb-2 skeleton"></div>
                  <div className="h-6 bg-muted rounded skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard 
                key={member.id} 
                member={member} 
                onManage={() => setSelectedMember(member)} 
              />
            ))}
          </div>
        )}

            {filteredMembers.length === 0 && !membersLoading && (
              <div className="text-center py-12" data-testid="no-members">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No members found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'cash' && (
          <div className="space-y-8">
            {/* Total Cash Display */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/20">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-bold mb-2" data-testid="total-cash">
                  ${totalCashData?.totalCash?.toLocaleString() || 0}
                </h2>
                <p className="text-lg text-muted-foreground">Total Server Cash</p>
              </div>
            </div>

            {/* Cash Members Grid */}
            {membersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-3 border border-border" data-testid={`cash-skeleton-${i}`}>
                    <div className="animate-pulse">
                      <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2 skeleton"></div>
                      <div className="h-3 bg-muted rounded mb-1 skeleton"></div>
                      <div className="h-4 bg-muted rounded skeleton"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                {members.map((member) => (
                  <CashMemberCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <BlockedWordsTab />
        )}

        {activeTab === 'roles' && (
          <RolesTab />
        )}
      </main>

      {/* Member Management Modal */}
      <MemberModal 
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}