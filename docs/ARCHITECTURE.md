# KOMUBEE Architecture

## Runtime map

- `client/`: Vite + React + TypeScript frontend.
- `server/`: Express backend and HTTP API.
- `shared/`: shared schema, constants, and cross-runtime types.
- `docs/`: canonical project documentation.

## Frontend structure

The frontend is organized by responsibility, not by import history.

- `client/src/pages/`: route-level orchestration and page composition only.
- `client/src/features/`: bounded UI features with their own tabs, components, and local types.
- `client/src/components/`: reusable app components that are not page-bound.
- `client/src/components/ui/`: base primitives and wrappers.
- `client/src/hooks/`: reusable stateful integrations.
- `client/src/lib/`: infrastructure helpers such as query client and utilities.

## Current feature boundaries

- `client/src/features/app-shell/`: application shell concerns, view routing, loading screen.
- `client/src/features/community/`: community experience, interaction tabs, shared community UI pieces.

## Page contract

Pages should stay thin.

- Fetch route-level data.
- Decide which feature module renders.
- Wire navigation between views.

Pages should not accumulate multiple independent subfeatures in one file.

## Feature contract

A feature folder may contain:

- `components/`: internal reusable pieces for the feature.
- `tabs/` or `sections/`: larger UI slices.
- `types.ts`: local composition types.
- `constants.ts`: feature-level configuration.
- `utils.ts`: pure helpers local to the feature.

If a piece becomes reused across multiple features, move it to `client/src/components/`.

## Shared contracts

Database models and app-wide constants live in `shared/schema.ts`.
Frontend feature files should import types from `shared/` rather than re-declare contracts.

## Architectural debt still present

- Some UI copy is still in English and should be converged to PT-BR when the relevant surface is revisited.
- `client/src/components/` still contains imported legacy components that should gradually move to feature folders or a clearer shared layer.
- API access is still query-key driven and can later evolve to explicit client modules per feature.

## Working rules

- Prefer extracting by feature over growing page files.
- Prefer local feature helpers over dumping generic code into `client/src/lib/`.
- Keep shared contracts in `shared/`.
- Update this document when a new top-level frontend boundary is introduced.