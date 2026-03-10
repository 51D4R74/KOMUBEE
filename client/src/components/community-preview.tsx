import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { POWER_LABELS, type Community } from "@shared/schema";
import { Users, Flame, Lock, Globe, ArrowRight } from "lucide-react";

interface CommunityPreviewProps {
  community: Community;
  isMember: boolean;
  onEnter: () => void;
  onJoin: () => void;
  onClose: () => void;
}

export function CommunityPreview({
  community,
  isMember,
  onEnter,
  onJoin,
  onClose,
}: CommunityPreviewProps) {
  const entryLabels: Record<string, string> = {
    open: "Open",
    question: "Question",
    invite: "Invite Only",
    challenge: "Challenge",
    approval: "Approval",
  };

  return (
    <div
      className="absolute right-0 top-0 w-[360px] h-full bg-card border-l border-border z-40 flex flex-col animate-float-in"
      data-testid="community-preview-panel"
    >
      <div className="relative h-32 flex items-end p-4" style={{
        background: `linear-gradient(135deg, ${community.color}22, ${community.color}08)`,
      }}>
        <div className="absolute top-3 right-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-preview"
          >
            <span className="text-muted-foreground text-lg">&times;</span>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-md flex items-center justify-center font-headline text-xl"
            style={{ backgroundColor: community.color + "33", color: community.color }}
          >
            {community.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-headline text-lg text-foreground" data-testid="text-community-name">
              {community.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-xs">
                {community.category}
              </Badge>
              {community.isPublic ? (
                <Globe className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {community.description && (
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-community-description">
            {community.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Members</span>
            </div>
            <span className="font-data text-lg text-foreground" data-testid="text-member-count">
              {community.memberCount}
            </span>
          </div>
          <div className="bg-background rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3.5 h-3.5" style={{ color: community.color }} />
              <span className="text-xs text-muted-foreground">Heat</span>
            </div>
            <span className="font-data text-lg" style={{ color: community.color }} data-testid="text-heat-score">
              {community.heatScore}
            </span>
          </div>
        </div>

        <div className="bg-background rounded-md p-3">
          <span className="text-xs text-muted-foreground block mb-1">Entry Type</span>
          <span className="text-sm text-foreground">
            {entryLabels[community.entryType] || community.entryType}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        {isMember ? (
          <Button
            className="w-full"
            onClick={onEnter}
            data-testid="button-enter-community"
          >
            Enter Community
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={onJoin}
            data-testid="button-join-community"
          >
            Join Community
          </Button>
        )}
      </div>
    </div>
  );
}
