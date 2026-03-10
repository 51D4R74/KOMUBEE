import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HexagonNode } from "./hexagon-node";
import type { Community } from "@shared/schema";

interface KomubeeBoardProps {
  communities: Community[];
  userMemberCommunityIds: string[];
  onCommunityClick: (community: Community) => void;
  onCommunityEnter: (community: Community) => void;
}

const NEIGHBOR_ANGLES = [270, 330, 30, 90, 150, 210];
const CENTER_SIZE = 180;
const NEIGHBOR_SIZE = 148;
const RADIUS = 200;

function getNeighborPosition(index: number, radius: number) {
  const angle = NEIGHBOR_ANGLES[index] * (Math.PI / 180);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export function KomubeeBoard({
  communities,
  userMemberCommunityIds,
  onCommunityClick,
  onCommunityEnter,
}: KomubeeBoardProps) {
  const communityMap = useMemo(() => {
    const map = new Map<string, Community>();
    communities.forEach((c) => map.set(c.id, c));
    return map;
  }, [communities]);

  const hottest = useMemo(() => {
    return [...communities].sort((a, b) => b.heatScore - a.heatScore)[0];
  }, [communities]);

  const [centerId, setCenterId] = useState<string>(hottest?.id || "");

  useEffect(() => {
    if (!communityMap.has(centerId) && communities.length > 0) {
      const best = [...communities].sort((a, b) => b.heatScore - a.heatScore)[0];
      setCenterId(best.id);
    }
  }, [communities, communityMap, centerId]);

  const centerCommunity = communityMap.get(centerId);

  const neighbors = useMemo(() => {
    if (!centerCommunity) return [];
    const relIds = centerCommunity.relatedIds || [];
    return relIds
      .map((id) => communityMap.get(id))
      .filter((c): c is Community => !!c)
      .slice(0, 6);
  }, [centerCommunity, communityMap]);

  const handleNeighborClick = useCallback((community: Community) => {
    setCenterId(community.id);
    onCommunityClick(community);
  }, [onCommunityClick]);

  const handleCenterClick = useCallback(() => {
    if (centerCommunity) {
      if (userMemberCommunityIds.includes(centerCommunity.id)) {
        onCommunityEnter(centerCommunity);
      } else {
        onCommunityClick(centerCommunity);
      }
    }
  }, [centerCommunity, userMemberCommunityIds, onCommunityEnter, onCommunityClick]);

  if (!centerCommunity) return null;

  const anchorX = RADIUS + 50;
  const anchorY = RADIUS + 50;

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden relative"
      data-testid="komubee-board"
      style={{
        background: "radial-gradient(ellipse at center, rgba(255,215,0,0.03) 0%, rgba(0,0,0,0) 50%), radial-gradient(ellipse at center, rgba(218,165,32,0.02) 0%, transparent 70%)",
      }}
    >
      <div className="relative" style={{ width: RADIUS * 2 + CENTER_SIZE + 100, height: RADIUS * 2 + CENTER_SIZE * 1.155 + 100 }}>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#DAA520" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {neighbors.map((neighbor, i) => {
            const pos = getNeighborPosition(i, RADIUS);
            return (
              <motion.line
                key={`line-${neighbor.id}`}
                x1={anchorX}
                y1={anchorY}
                x2={anchorX + pos.x}
                y2={anchorY + pos.y}
                stroke="url(#goldLine)"
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            );
          })}
        </svg>

        <div
          className="absolute"
          style={{
            left: anchorX,
            top: anchorY,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <motion.div
            key={`center-${centerId}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <HexagonNode
              community={centerCommunity}
              isCenter={true}
              onClick={handleCenterClick}
              size={CENTER_SIZE}
            />
          </motion.div>
        </div>

        <AnimatePresence mode="popLayout">
          {neighbors.map((neighbor, i) => {
            const pos = getNeighborPosition(i, RADIUS);

            return (
              <motion.div
                key={`neighbor-${neighbor.id}`}
                className="absolute"
                style={{
                  left: anchorX + pos.x,
                  top: anchorY + pos.y,
                  transform: "translate(-50%, -50%)",
                  zIndex: 5,
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 22,
                  delay: i * 0.06,
                }}
              >
                <HexagonNode
                  community={neighbor}
                  isCenter={false}
                  onClick={() => handleNeighborClick(neighbor)}
                  size={NEIGHBOR_SIZE}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
