# Komubee

A community-first social network with hexagonal navigation. Communities are the fundamental unit, not individuals.

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **Auth**: Passport.js with local strategy (session-based)
- **Styling**: Premium dark (#09090b) with gold metallic accents (#FFD700, #DAA520, #B8860B)
- **Fonts**: Space Grotesk (headlines), DM Sans (body), JetBrains Mono (data)

## Homepage — Honeycomb Graph Navigation

The homepage uses a graph-based honeycomb layout:
- **KomubeeBoard** (`komubee-board.tsx`): Renders 1 center hex + up to 6 neighbor hexes radially
- **HexagonNode** (`hexagon-node.tsx`): CSS `clip-path` hexagons with gold gradient borders, cover images, dark overlays
- Communities are linked via `relatedIds` (bidirectional graph). Clicking a neighbor re-centers the board with Framer Motion animations
- Center hex has intense golden glow; neighbors fade in/out with spring animations
- Golden SVG connection lines between center and neighbors
- Old SVG-based `hex-grid.tsx` kept as fallback but not used

## Key Features

- Interactive honeycomb graph navigation with Framer Motion transitions
- Community creation with custom colors, categories, cover images, and entry types
- 6 interaction types: Colmeia (threaded chat), Fogueira (live audio rooms), Missão (collaborative missions), Quiz (weighted voting), Arena (moderated debate), Mosaico (collaborative board)
- 5-level power hierarchy (Explorer, Member, Catalyst, Guardian, Founder)
- Minimalist user profiles focused on community participation
- Heat score system indicating community activity

## Data Model

- **users**: id, username, password, bio, avatarColor
- **communities**: id, name, description, color, category, founderId, entryType, heatScore, memberCount, isPublic, gridX, gridY, coverImageUrl, relatedIds[]
- **community_members**: id, communityId, userId, powerLevel, joinedAt
- **threads**: id, communityId, authorId, title, content, isPinned, isArchived, messageCount, lastActivityAt
- **thread_messages**: id, threadId, authorId, content, createdAt
- **missions**: id, communityId, creatorId, title, description, targetCount, currentCount, isCompleted
- **mission_contributions**: id, missionId, userId, content, amount
- **polls**: id, communityId, creatorId, question, pollType, isAnonymous, isActive
- **poll_options**: id, pollId, text, voteCount
- **poll_votes**: id, pollId, optionId, userId, weight
- **arenas**: id, communityId, creatorId, proposition, sideALabel, sideBLabel, turnDuration, isActive
- **arena_arguments**: id, arenaId, userId, side, content
- **arena_votes**: id, arenaId, userId, side
- **mosaics**: id, communityId, creatorId, title, description, format, rules
- **mosaic_pieces**: id, mosaicId, userId, pieceType, content
- **fogueiras**: id, communityId, creatorId, title, isLive, speakerCount, listenerCount
- **fogueira_brasas**: id, fogueiraId, userId, content

## Color Palette

- Gold: #FFD700 (primary gold), #DAA520 (dark gold), #B8860B (darker gold)
- Background: #09090b (deep black)
- Community colors: individual per community
- CSS utilities: `.gold-gradient`, `.gold-text`, `.hex-clip`, `.animate-gold-pulse`

## Seed Data

Demo users: aurora, nexus, cipher, ember, atlas (password: demo1234)
9 seed communities with cover images, related IDs, threads, and messages pre-populated.
