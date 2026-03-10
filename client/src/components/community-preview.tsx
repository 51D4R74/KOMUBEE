import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { POWER_LABELS, type Community } from "@shared/schema";
import { Users, Flame, Lock, Globe, ArrowRight, X } from "lucide-react";

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
      className="absolute right-0 top-0 w-[360px] h-full z-40 flex flex-col animate-float-in"
      style={{
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        backdropFilter: "blur(16px)",
        borderLeft: "1px solid rgba(255, 215, 0, 0.12)",
      }}
      data-testid="community-preview-panel"
    >
      <div
        className="relative h-40 flex items-end p-4"
        style={{
          backgroundImage: community.coverImageUrl
            ? `linear-gradient(to top, rgba(9,9,11,1) 0%, rgba(9,9,11,0.4) 50%, rgba(9,9,11,0.2) 100%), url(${community.coverImageUrl})`
            : `linear-gradient(135deg, ${community.color}33, ${community.color}11)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute top-3 right-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="text-white/50 hover:text-yellow-400 hover:bg-yellow-400/10"
            data-testid="button-close-preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-md hex-clip flex items-center justify-center font-headline text-xl"
            style={{ backgroundColor: community.color + "44", color: "#FFD700" }}
          >
            {community.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-headline text-lg text-white" data-testid="text-community-name">
              {community.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="secondary"
                className="text-xs bg-yellow-600/15 text-yellow-400/80 border border-yellow-600/20"
              >
                {community.category}
              </Badge>
              {community.isPublic ? (
                <Globe className="w-3 h-3 text-white/40" />
              ) : (
                <Lock className="w-3 h-3 text-white/40" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {community.description && (
          <p className="text-sm text-white/50 leading-relaxed" data-testid="text-community-description">
            {community.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,215,0,0.08)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/40">Members</span>
            </div>
            <span className="font-data text-lg text-white" data-testid="text-member-count">
              {community.memberCount}
            </span>
          </div>
          <div className="rounded-md p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,215,0,0.08)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3.5 h-3.5" style={{ color: "#FFD700" }} />
              <span className="text-xs text-white/40">Heat</span>
            </div>
            <span className="font-data text-lg gold-text" data-testid="text-heat-score">
              {community.heatScore}
            </span>
          </div>
        </div>

        <div className="rounded-md p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,215,0,0.08)" }}>
          <span className="text-xs text-white/40 block mb-1">Entry Type</span>
          <span className="text-sm text-white/80">
            {entryLabels[community.entryType] || community.entryType}
          </span>
        </div>
      </div>

      <div className="p-4" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.1)" }}>
        {isMember ? (
          <Button
            className="w-full font-headline"
            onClick={onEnter}
            style={{
              background: "linear-gradient(135deg, #FFD700, #DAA520)",
              color: "#09090b",
              border: "none",
            }}
            data-testid="button-enter-community"
          >
            Enter Community
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="w-full font-headline"
            onClick={onJoin}
            style={{
              background: "linear-gradient(135deg, #FFD700, #DAA520)",
              color: "#09090b",
              border: "none",
            }}
            data-testid="button-join-community"
          >
            Join Community
          </Button>
        )}
      </div>
    </div>
  );
}
