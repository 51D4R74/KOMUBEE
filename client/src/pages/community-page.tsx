import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Flame, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMUNITY_TABS } from "@/features/community/constants";
import { MembersSidebar } from "@/features/community/components/members-sidebar";
import { ArenaTab } from "@/features/community/tabs/arena-tab";
import { ColmeiaTab } from "@/features/community/tabs/colmeia-tab";
import { FogueiraTab } from "@/features/community/tabs/fogueira-tab";
import { MissaoTab } from "@/features/community/tabs/missao-tab";
import { MosaicoTab } from "@/features/community/tabs/mosaico-tab";
import { QuizTab } from "@/features/community/tabs/quiz-tab";
import type { CommunityMemberWithUser, InteractionTab } from "@/features/community/types";
import { useAuth } from "@/hooks/use-auth";
import { POWER_LABELS, type Community } from "@shared/schema";

interface CommunityPageProps {
  communityId: string;
  onBack: () => void;
}

export function CommunityPage({ communityId, onBack }: Readonly<CommunityPageProps>) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<InteractionTab>("colmeia");

  const { data: community, isLoading: communityLoading } = useQuery<Community>({
    queryKey: ["/api/communities", communityId],
  });

  const { data: members = [] } = useQuery<CommunityMemberWithUser[]>({
    queryKey: ["/api/communities", communityId, "members"],
  });

  const myMembership = members.find((member) => member.userId === user?.id);

  if (communityLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="community-page">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${community.color}08, transparent)` }}>
        <Button size="icon" variant="ghost" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-md flex items-center justify-center font-headline text-sm" style={{ backgroundColor: community.color + "33", color: community.color }}>
          {community.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-headline text-lg text-foreground truncate" data-testid="text-community-title">
            {community.name}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {community.memberCount}
            </span>
            <span className="flex items-center gap-1" style={{ color: community.color }}>
              <Flame className="w-3 h-3" /> {community.heatScore}
            </span>
            {myMembership && (
              <Badge variant="secondary" className="text-xs">
                {POWER_LABELS[myMembership.powerLevel]}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-border flex gap-0 overflow-x-auto px-2" data-testid="interaction-tabs">
        {COMMUNITY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeTab === "colmeia" && <ColmeiaTab communityId={communityId} members={members} myMembership={myMembership} communityColor={community.color} />}
          {activeTab === "fogueira" && <FogueiraTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />}
          {activeTab === "missao" && <MissaoTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />}
          {activeTab === "quiz" && <QuizTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />}
          {activeTab === "arena" && <ArenaTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />}
          {activeTab === "mosaico" && <MosaicoTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />}
        </div>

        <MembersSidebar members={members} />
      </div>
    </div>
  );
}
