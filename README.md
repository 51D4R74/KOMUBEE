# Komubee

A community-first social network with hexagonal navigation. Communities are the fundamental unit, not individuals.

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Shadcn/UI
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **Auth**: Passport.js with local strategy (session-based)
- **Styling**: Dark-first theme with Space Grotesk (headlines), DM Sans (body), JetBrains Mono (data)

## Key Features

- Interactive hexagonal grid for community exploration (pan/zoom/click)
- Community creation with custom colors, categories, and entry types
- 6 interaction types: Colmeia (threaded chat), Fogueira (live audio rooms), Missão (collaborative missions), Quiz (weighted voting), Arena (moderated debate), Mosaico (collaborative board)
- 5-level power hierarchy (Explorer, Member, Catalyst, Guardian, Founder)
- Minimalist user profiles focused on community participation
- Heat score system indicating community activity

## Data Model

- **users**: id, username, password, bio, avatarColor
- **communities**: id, name, description, color, category, founderId, entryType, heatScore, memberCount, isPublic, gridX, gridY
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

- Primary: Coral (#E63946)
- Accent: Amber (#F4A261)
- Dark BG: Deep Space (#08081A via CSS vars)
- Card BG: Midnight (#12121F via CSS vars)

## Seed Data

Demo users: aurora, nexus, cipher, ember, atlas (password: demo1234)
9 seed communities with threads and messages pre-populated.
