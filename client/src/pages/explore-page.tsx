import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { HexGrid } from "@/components/hex-grid";
import { CommunityPreview } from "@/components/community-preview";
import { CreateCommunityDialog } from "@/components/create-community-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Community } from "@shared/schema";
import { Hexagon, Search, User, LogOut, Flame } from "lucide-react";

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

  const handleCommunityDoubleClick = useCallback((community: Community) => {
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
    <div className="h-full flex flex-col relative" data-testid="explore-page">
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-3 z-30 bg-background">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Hexagon className="w-7 h-7 text-primary" strokeWidth={2} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </div>
          <span className="font-headline text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Komubee
          </span>
        </div>

        <div className="flex-1 max-w-xs mx-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
            data-testid="input-search"
          />
        </div>

        <div className="flex items-center gap-2">
          <CreateCommunityDialog />
          <Button
            size="icon"
            variant="ghost"
            onClick={onProfileClick}
            data-testid="button-profile"
          >
            <User className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout.mutate()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hotCommunities.length > 0 && !searchQuery && (
        <div className="absolute top-14 left-4 z-20 flex items-center gap-2 animate-float-in">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground mr-1">Hot:</span>
          {hotCommunities.map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="cursor-pointer text-xs"
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
                <Hexagon className="w-16 h-16 text-primary animate-hex-pulse" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary animate-hex-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Loading the universe...</p>
            </div>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Hexagon className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No communities found" : "No communities yet"}
              </p>
              <p className="text-xs text-muted-foreground opacity-60">
                Create the first one and start building
              </p>
            </div>
          </div>
        ) : (
          <HexGrid
            communities={filteredCommunities}
            userMemberCommunityIds={myCommunityIds}
            onCommunityClick={handleCommunityClick}
            onCommunityDoubleClick={handleCommunityDoubleClick}
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
