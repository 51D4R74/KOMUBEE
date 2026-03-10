import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import type { Community } from "@shared/schema";

interface HexGridProps {
  communities: Community[];
  userMemberCommunityIds: string[];
  onCommunityClick: (community: Community) => void;
  onCommunityDoubleClick: (community: Community) => void;
}

const HEX_SIZE = 64;
const HEX_SPACING = 1.12;

function axialToPixel(q: number, r: number): { x: number; y: number } {
  const size = HEX_SIZE * HEX_SPACING;
  const x = size * (3 / 2) * q;
  const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x, y };
}

function getHexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return points.join(" ");
}

function hexColor(color: string, opacity: number): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function generateHexSpiralPositions(count: number): { q: number; r: number }[] {
  if (count <= 0) return [];
  const positions: { q: number; r: number }[] = [{ q: 0, r: 0 }];
  if (count === 1) return positions;

  const directions = [
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
  ];

  let ring = 1;
  while (positions.length < count) {
    let q = 0;
    let r = -ring;

    for (let side = 0; side < 6 && positions.length < count; side++) {
      for (let step = 0; step < ring && positions.length < count; step++) {
        positions.push({ q, r });
        q += directions[side].q;
        r += directions[side].r;
      }
    }
    ring++;
  }

  return positions;
}

export function HexGrid({
  communities,
  userMemberCommunityIds,
  onCommunityClick,
  onCommunityDoubleClick,
}: HexGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMoved, setDragMoved] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

  const gridPositions = useMemo(() => {
    const map = new Map<string, { q: number; r: number }>();
    const spiral = generateHexSpiralPositions(communities.length);
    communities.forEach((c, i) => {
      map.set(c.id, spiral[i]);
    });
    return map;
  }, [communities]);

  const gridBounds = useMemo(() => {
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    communities.forEach((c) => {
      const pos = gridPositions.get(c.id);
      if (!pos) return;
      const px = axialToPixel(pos.q, pos.r);
      minX = Math.min(minX, px.x);
      maxX = Math.max(maxX, px.x);
      minY = Math.min(minY, px.y);
      maxY = Math.max(maxY, px.y);
    });
    return {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
    };
  }, [communities, gridPositions]);

  const recenter = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
      setOffset({
        x: rect.width / 2 - gridBounds.cx,
        y: rect.height / 2 - gridBounds.cy,
      });
    }
  }, [gridBounds]);

  useEffect(() => {
    recenter();
    const timer = setTimeout(recenter, 100);
    window.addEventListener("resize", recenter);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", recenter);
    };
  }, [recenter]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    setDragMoved(false);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setDragMoved(true);
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((prev) => Math.max(0.3, Math.min(2.5, prev + delta)));
  }, []);

  const handleHexClick = useCallback((community: Community) => {
    if (dragMoved) return;
    const now = Date.now();
    const last = lastClickRef.current;
    if (last && last.id === community.id && now - last.time < 400) {
      onCommunityDoubleClick(community);
      lastClickRef.current = null;
    } else {
      onCommunityClick(community);
      lastClickRef.current = { id: community.id, time: now };
    }
  }, [onCommunityClick, onCommunityDoubleClick, dragMoved]);

  const clampTooltip = useCallback((sx: number, sy: number) => {
    const tw = 210, th = 160;
    let x = sx + HEX_SIZE * scale + 14;
    let y = sy - 50;
    if (x + tw > containerSize.w) x = sx - HEX_SIZE * scale - tw - 14;
    if (y + th > containerSize.h) y = containerSize.h - th - 10;
    if (y < 10) y = 10;
    if (x < 10) x = 10;
    return { x, y };
  }, [scale, containerSize]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      data-testid="hex-grid-container"
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, rgba(230,57,70,0.04) 0%, transparent 60%)",
      }} />

      <svg className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          {communities.map((community) => (
            <filter key={`glow-${community.id}`} id={`glow-${community.id}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feFlood floodColor={community.color} floodOpacity="0.45" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <g
          transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}
          style={{ transition: dragging ? "none" : "transform 0.15s ease-out" }}
        >
        {communities.map((community) => {
          const pos = gridPositions.get(community.id);
          if (!pos) return null;
          const { x, y } = axialToPixel(pos.q, pos.r);
          const isHovered = hoveredId === community.id;
          const isMember = userMemberCommunityIds.includes(community.id);
          const heatOpacity = Math.max(0.3, community.heatScore / 100);
          const isHot = community.heatScore > 70;

          return (
            <g
              key={community.id}
              data-hex
              data-testid={`hex-community-${community.id}`}
              className="cursor-pointer"
              style={{
                transform: isHovered ? "scale(1.07)" : "scale(1)",
                transformOrigin: `${x}px ${y}px`,
                transition: "transform 0.2s ease-out",
              }}
              onMouseEnter={() => setHoveredId(community.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleHexClick(community)}
            >
              {isHovered && (
                <polygon
                  points={getHexPoints(x, y, HEX_SIZE + 5)}
                  fill="none"
                  stroke={hexColor(community.color, 0.12)}
                  strokeWidth={1}
                />
              )}

              <polygon
                points={getHexPoints(x, y, HEX_SIZE)}
                fill={hexColor(community.color, heatOpacity * 0.12)}
                stroke={isMember ? "#F4A261" : hexColor(community.color, isHovered ? 0.65 : 0.3)}
                strokeWidth={isMember ? 2.5 : 1.5}
                filter={isHovered ? `url(#glow-${community.id})` : undefined}
                className={isHot ? "animate-hex-pulse" : ""}
              />

              <polygon
                points={getHexPoints(x, y, HEX_SIZE * 0.78)}
                fill={hexColor(community.color, heatOpacity * 0.05)}
                stroke="none"
              />

              {isHot && (
                <circle
                  cx={x + HEX_SIZE * 0.48}
                  cy={y - HEX_SIZE * 0.52}
                  r={4}
                  fill={community.color}
                  className="animate-hex-pulse"
                />
              )}

              {isMember && (
                <polygon
                  points={getHexPoints(x, y, HEX_SIZE + 1)}
                  fill="none"
                  stroke="#F4A261"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  opacity={0.4}
                />
              )}

              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fill="hsl(0, 0%, 90%)"
                fontSize="11.5"
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="700"
                className="pointer-events-none"
              >
                {community.name.length > 14
                  ? community.name.substring(0, 13) + "..."
                  : community.name}
              </text>

              <text
                x={x}
                y={y + 8}
                textAnchor="middle"
                fill="hsl(0, 0%, 48%)"
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
                className="pointer-events-none"
              >
                {community.memberCount} members
              </text>

              <text
                x={x}
                y={y + 22}
                textAnchor="middle"
                fill={community.color}
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="500"
                className="pointer-events-none"
                opacity={0.75}
              >
                {community.heatScore}
              </text>
            </g>
          );
        })}
        </g>
      </svg>

      {hoveredId && (() => {
        const community = communities.find((c) => c.id === hoveredId);
        if (!community) return null;
        const pos = gridPositions.get(community.id);
        if (!pos) return null;
        const { x, y } = axialToPixel(pos.q, pos.r);
        const screenX = x * scale + offset.x;
        const screenY = y * scale + offset.y;
        const isMember = userMemberCommunityIds.includes(community.id);
        const clamped = clampTooltip(screenX, screenY);

        return (
          <div
            className="absolute pointer-events-none animate-float-in z-50"
            style={{ left: clamped.x, top: clamped.y }}
            data-testid={`hex-tooltip-${community.id}`}
          >
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-md p-3 min-w-[190px] max-w-[220px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: community.color }} />
                <span className="font-headline text-sm text-foreground truncate">{community.name}</span>
              </div>
              {community.description && (
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">{community.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs font-data">
                <span className="text-muted-foreground">{community.memberCount} members</span>
                <span style={{ color: community.color }}>Heat {community.heatScore}</span>
              </div>
              {isMember && (
                <div className="mt-1.5">
                  <span className="text-xs font-data" style={{ color: "#F4A261" }}>You are a member</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2 opacity-50">Double-click to enter</p>
            </div>
          </div>
        );
      })()}

      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-20">
        <button
          onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
          className="w-8 h-8 rounded-md bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground text-sm hover-elevate"
          data-testid="button-zoom-in"
        >+</button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}
          className="w-8 h-8 rounded-md bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground text-sm hover-elevate"
          data-testid="button-zoom-out"
        >-</button>
        <button
          onClick={() => { recenter(); setScale(1); }}
          className="w-8 h-8 rounded-md bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground text-xs hover-elevate"
          data-testid="button-recenter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
