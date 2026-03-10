import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { KomubeeBoard } from "@/components/komubee-board";
import { CommunityPreview } from "@/components/community-preview";
import { CreateCommunityDialog } from "@/components/create-community-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Community } from "@shared/schema";
import { Hexagon, Search, User, LogOut, Flame, Plus } from "lucide-react";

interface ExplorePageProps {
  onCommunityEnter: (communityId: string) => void;
  onProfileClick: () => void;
}

export function ExplorePage({ onCommunityEnter, onProfileClick }: ExplorePageProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [previewCommunity, setPreviewCommunity] = useState<Community | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const { data: myCommunityIds = [] } = useQuery<string[]>({
    queryKey: ["/api/communities/mine/ids"],
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/join`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities/mine/ids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      toast({ title: "Joined community!" });
      if (previewCommunity) {
        onCommunityEnter(previewCommunity.id);
        setPreviewCommunity(null);
      }
    },
    onError: (err: any) => {
      toast({ title: "Failed to join", description: err.message, variant: "destructive" });
    },
  });

  const handleCommunityClick = useCallback((community: Community) => {
    setPreviewCommunity(community);
  }, []);

  const handleCommunityEnter = useCallback((community: Community) => {
    if (myCommunityIds.includes(community.id)) {
      onCommunityEnter(community.id);
    } else {
      setPreviewCommunity(community);
    }
  }, [myCommunityIds, onCommunityEnter]);

  const filteredCommunities = searchQuery
    ? communities.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : communities;

  const hotCommunities = [...communities]
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col relative" data-testid="explore-page" style={{ background: "#09090b" }}>
      <div
        className="border-b px-5 py-3 flex items-center gap-4 z-30 relative"
        style={{
          backgroundColor: "rgba(9, 9, 11, 0.85)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255, 215, 0, 0.1)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Hexagon className="w-8 h-8" style={{ color: "#FFD700" }} strokeWidth={2} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFD700" }} />
            </div>
          </div>
          <span className="font-headline text-xl gold-text" data-testid="text-logo">
            KOMUBEE
          </span>
        </div>

        <div className="flex-1 max-w-sm mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255, 215, 0, 0.4)" }} />
          <Input
            type="search"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-white/5 border-white/10 focus:border-yellow-600/50 placeholder:text-white/30"
            data-testid="input-search"
          />
        </div>

        <div className="flex items-center gap-2">
          <CreateCommunityDialog />
          <Button
            size="icon"
            variant="ghost"
            onClick={onProfileClick}
            className="text-white/50 hover:text-yellow-400 hover:bg-yellow-400/10"
            data-testid="button-profile"
          >
            <User className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout.mutate()}
            className="text-white/50 hover:text-yellow-400 hover:bg-yellow-400/10"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hotCommunities.length > 0 && !searchQuery && (
        <div className="absolute top-16 left-5 z-20 flex items-center gap-2 animate-float-in">
          <Flame className="w-3.5 h-3.5" style={{ color: "#FFD700" }} />
          <span className="text-xs mr-1" style={{ color: "rgba(255, 215, 0, 0.5)" }}>Hot:</span>
          {hotCommunities.map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="cursor-pointer text-xs bg-white/5 border border-yellow-600/20 text-white/70 hover:bg-yellow-600/10 hover:text-yellow-300"
              onClick={() => setPreviewCommunity(c)}
              data-testid={`badge-hot-${c.id}`}
            >
              <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: c.color }} />
              {c.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <Hexagon className="w-16 h-16 animate-hex-pulse" style={{ color: "#FFD700" }} strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full animate-hex-pulse" style={{ backgroundColor: "#FFD700" }} />
                </div>
              </div>
              <p className="text-sm" style={{ color: "rgba(255, 215, 0, 0.5)" }}>Loading the hive...</p>
            </div>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Hexagon className="w-12 h-12 mx-auto opacity-30" style={{ color: "#FFD700" }} />
              <p className="text-sm text-white/50">
                {searchQuery ? "No communities found" : "No communities yet"}
              </p>
              <p className="text-xs text-white/30">
                Create the first one and start building
              </p>
            </div>
          </div>
        ) : (
          <KomubeeBoard
            communities={filteredCommunities}
            userMemberCommunityIds={myCommunityIds}
            onCommunityClick={handleCommunityClick}
            onCommunityEnter={handleCommunityEnter}
          />
        )}

        {previewCommunity && (
          <CommunityPreview
            community={previewCommunity}
            isMember={myCommunityIds.includes(previewCommunity.id)}
            onEnter={() => {
              onCommunityEnter(previewCommunity.id);
              setPreviewCommunity(null);
            }}
            onJoin={() => joinMutation.mutate(previewCommunity.id)}
            onClose={() => setPreviewCommunity(null)}
          />
        )}
      </div>
    </div>
  );
}
