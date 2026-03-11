interface AvatarUser {
  username?: string | null;
  avatarColor?: string | null;
}

interface UserAvatarProps {
  user?: AvatarUser | null;
  size?: "sm" | "md";
}

export function UserAvatar({ user, size = "sm" }: UserAvatarProps) {
  const sizeClassName = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <div
      className={`${sizeClassName} rounded-md flex items-center justify-center font-headline shrink-0`}
      style={{
        backgroundColor: (user?.avatarColor || "#E63946") + "33",
        color: user?.avatarColor || "#E63946",
      }}
    >
      {user?.username?.charAt(0).toUpperCase() || "?"}
    </div>
  );
}