import type { CommunityMember, User } from "@shared/schema";

export type InteractionTab = "colmeia" | "fogueira" | "missao" | "quiz" | "arena" | "mosaico";

export type CommunityMemberWithUser = CommunityMember & { user: User };

export interface CommunityTabProps {
  communityId: string;
  myMembership?: CommunityMember;
  communityColor: string;
}

export interface ColmeiaTabProps extends CommunityTabProps {
  members: CommunityMemberWithUser[];
}