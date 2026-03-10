import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { POWER_LABELS, COMMUNITY_COLORS, type Community, type CommunityMember } from "@shared/schema";
import {
  ArrowLeft,
  Hexagon,
  Users,
  Clock,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";

interface ProfilePageProps {
  onBack: () => void;
  onCommunityClick: (communityId: string) => void;
}

export function ProfilePage({ onBack, onCommunityClick }: ProfilePageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [editingColor, setEditingColor] = useState(false);

  const { data: myCommunities = [], isLoading: communitiesLoading } = useQuery<
    (CommunityMember & { community: Community })[]
  >({
    queryKey: ["/api/user/communities"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { bio?: string; avatarColor?: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditingBio(false);
      setEditingColor(false);
      toast({ title: "Profile updated" });
    },
  });

  if (!user) return null;

  const founded = myCommunities.filter((m) => m.powerLevel === 5);
  const totalCommunities = myCommunities.length;

  return (
    <div className="h-full flex flex-col" data-testid="profile-page">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={onBack} data-testid="button-back-profile">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-headline text-lg text-foreground">Profile</h1>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="relative group">
              <div
                className="w-16 h-16 rounded-md flex items-center justify-center font-headline text-2xl cursor-pointer"
                style={{
                  backgroundColor: (user.avatarColor || "#E63946") + "33",
                  color: user.avatarColor || "#E63946",
                }}
                onClick={() => setEditingColor(!editingColor)}
                data-testid="button-edit-avatar"
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              {editingColor && (
                <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-md p-2 z-10 flex flex-wrap gap-1.5 w-44 animate-float-in">
                  {COMMUNITY_COLORS.map((c) => (
                    <button
                      key={c}
                      className="w-7 h-7 rounded-md"
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        updateProfileMutation.mutate({ avatarColor: c });
                      }}
                      data-testid={`button-avatar-color-${c}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-headline text-xl text-foreground" data-testid="text-username">
                {user.username}
              </h2>
              {editingBio ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                    placeholder="Tell us about yourself..."
                    className="resize-none text-sm"
                    rows={3}
                    data-testid="input-bio"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateProfileMutation.mutate({ bio })}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-bio"
                    >
                      <Check className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingBio(false); setBio(user.bio || ""); }}
                      data-testid="button-cancel-bio"
                    >
                      <X className="w-3 h-3 mr-1" /> Cancel
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {bio.length}/160
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-start gap-2">
                  <p className="text-sm text-muted-foreground flex-1" data-testid="text-bio">
                    {user.bio || "No bio yet"}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingBio(true)}
                    data-testid="button-edit-bio"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-md p-3 text-center">
              <Hexagon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="font-data text-lg text-foreground" data-testid="text-stat-communities">
                {totalCommunities}
              </div>
              <div className="text-xs text-muted-foreground">Communities</div>
            </div>
            <div className="bg-card rounded-md p-3 text-center">
              <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="font-data text-lg text-foreground" data-testid="text-stat-founded">
                {founded.length}
              </div>
              <div className="text-xs text-muted-foreground">Founded</div>
            </div>
            <div className="bg-card rounded-md p-3 text-center">
              <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <div className="font-data text-lg text-foreground">-</div>
              <div className="text-xs text-muted-foreground">Days Active</div>
            </div>
          </div>

          <div>
            <h3 className="font-headline text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Your Communities
            </h3>
            {communitiesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : myCommunities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 opacity-60">
                You haven't joined any communities yet
              </p>
            ) : (
              <div className="space-y-2">
                {myCommunities.map((membership) => (
                  <button
                    key={membership.id}
                    onClick={() => onCommunityClick(membership.communityId)}
                    className="w-full text-left flex items-center gap-3 p-3 bg-card rounded-md hover-elevate transition-colors"
                    data-testid={`button-community-${membership.communityId}`}
                  >
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center font-headline text-sm shrink-0"
                      style={{
                        backgroundColor: (membership.community as any)?.color
                          ? (membership.community as any).color + "33"
                          : "#E6394633",
                        color: (membership.community as any)?.color || "#E63946",
                      }}
                    >
                      {(membership.community as any)?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {(membership.community as any)?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {POWER_LABELS[membership.powerLevel]}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {(membership.community as any)?.category || "general"}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
