import { CommunityPage } from "@/pages/community-page";
import { ExplorePage } from "@/pages/explore-page";
import { ProfilePage } from "@/pages/profile-page";

import type { AppView } from "./types";

interface AppViewRouterProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
}

export function AppViewRouter({ view, onNavigate }: Readonly<AppViewRouterProps>) {
  if (view.type === "community") {
    return <CommunityPage communityId={view.communityId} onBack={() => onNavigate({ type: "explore" })} />;
  }

  if (view.type === "profile") {
    return (
      <ProfilePage
        onBack={() => onNavigate({ type: "explore" })}
        onCommunityClick={(communityId) => onNavigate({ type: "community", communityId })}
      />
    );
  }

  return (
    <ExplorePage
      onCommunityEnter={(communityId) => onNavigate({ type: "community", communityId })}
      onProfileClick={() => onNavigate({ type: "profile" })}
    />
  );
}