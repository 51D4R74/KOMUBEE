import { PowerIcon } from "./power-icon";
import { UserAvatar } from "./user-avatar";

import type { CommunityMemberWithUser } from "../types";
import { getPowerLevelTextColor } from "../utils";

interface MembersSidebarProps {
  members: CommunityMemberWithUser[];
}

export function MembersSidebar({ members }: MembersSidebarProps) {
  return (
    <div className="w-48 border-l border-border flex-col hidden xl:flex">
      <div className="px-3 py-3 border-b border-border">
        <h3 className="font-headline text-xs text-muted-foreground uppercase tracking-wider">
          Members ({members.length})
        </h3>
      </div>
      <div className="flex-1 overflow-auto">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-2 px-3 py-1.5" data-testid={`member-${member.id}`}>
            <UserAvatar user={member.user} />
            <span className="text-xs truncate flex-1" style={{ color: getPowerLevelTextColor(member.powerLevel) }}>
              {member.user?.username || "Unknown"}
            </span>
            <PowerIcon level={member.powerLevel} />
          </div>
        ))}
      </div>
    </div>
  );
}