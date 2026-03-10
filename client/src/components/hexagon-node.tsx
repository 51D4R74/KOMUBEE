import { motion } from "framer-motion";
import type { Community } from "@shared/schema";
import { Users, Flame } from "lucide-react";

interface HexagonNodeProps {
  community: Community;
  isCenter: boolean;
  onClick: () => void;
  size?: number;
}

export function HexagonNode({ community, isCenter, onClick, size = 150 }: HexagonNodeProps) {
  const borderWidth = 3;
  const innerSize = size - borderWidth * 2;

  const bgImage = community.coverImageUrl
    ? `url(${community.coverImageUrl})`
    : `linear-gradient(135deg, ${community.color}cc, ${community.color}44)`;

  return (
    <motion.div
      className="cursor-pointer select-none"
      style={{ width: size, height: size * 1.155 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      data-testid={`hex-node-${community.id}`}
    >
      <div
        className="relative w-full h-full"
        style={{
          filter: isCenter
            ? "drop-shadow(0 0 24px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 48px rgba(255, 215, 0, 0.25))"
            : "drop-shadow(0 0 8px rgba(255, 215, 0, 0.15))",
          transition: "filter 0.4s ease",
        }}
      >
        <div
          className="hex-clip gold-gradient w-full h-full absolute inset-0"
          style={isCenter ? { animation: "gold-pulse 3s ease-in-out infinite" } : undefined}
        />

        <div
          className="hex-clip absolute"
          style={{
            top: borderWidth,
            left: borderWidth,
            width: innerSize,
            height: innerSize * 1.155,
            overflow: "hidden",
          }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: bgImage }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.15) 100%)",
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-end pb-[18%] px-2">
            <h3
              className="font-headline text-white text-center leading-tight drop-shadow-lg"
              style={{ fontSize: size > 160 ? 15 : 13 }}
            >
              {community.name}
            </h3>
            <span
              className="text-white/50 font-data mt-0.5 uppercase tracking-wider"
              style={{ fontSize: size > 160 ? 9 : 8 }}
            >
              {community.category}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-0.5 text-white/60" style={{ fontSize: 9 }}>
                <Users className="w-2.5 h-2.5" />
                {community.memberCount}
              </span>
              <span className="flex items-center gap-0.5" style={{ fontSize: 9, color: "#FFD700" }}>
                <Flame className="w-2.5 h-2.5" />
                {community.heatScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
