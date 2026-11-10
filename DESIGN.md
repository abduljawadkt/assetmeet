# AssetMeet design system

The interface follows the **AssetMeet-Deployable** reference design (shared November 2026): an Apple-like light site with a green "am" wordmark, a map-free "highway" market metaphor and a calm, green-tinted workspace.

## Source of truth

The reference stylesheets are used as delivered, so the product matches the reference exactly:

| File | What it styles |
|---|---|
| `app/globals.css` | Base type and tokens, entry screen, engine guide animation, legacy workspace pieces (pipeline, deal cards) |
| `app/apple.css` | Landing page (`ap-*`), entry and onboarding (`engine-*`, `role-options`), buttons, forms |
| `app/highway.css` | Market view billboards and lanes (`hw-*`), the side panel and its tabs |
| `app/market-dashboard.css` | Workspace shell (`md-*`): sidebar, dashboard cards, attention list, tables, list + inline detail |
| `app/workspace.css` | AssetMeet additions in the same visual language (`am-*`): record forms, facts grid, Deal Desk tags, opportunity tracks, introduction requests |

Change the reference files only to fix a defect; put new styles in `app/workspace.css`.

## Flow

1. **Landing** (`app/landing.tsx`, `app/landing.css`): a short story in five full-screen chapters, after the flow of micro.company: welcome; Every building is an asset; Every requirement is an opportunity; Every verified match is a potential transaction; Where would you like to begin (owner, business, engineer, then sign in and sample workspace). One idea and one short line per screen, a fixed dot rail showing the current chapter, gentle snap between chapters, and each chapter easing in (off when reduced motion is set; content is never hidden without JavaScript). No photos.
2. **Entry** (`app/entry.tsx`): "I have a property" / "I need a property", email sign-in link (or password for team-created accounts), then role and profile. The engine guide animation sits beside it.
3. **Workspace** (`app/workspace.tsx`): sidebar shell.
   - Members: Dashboard, My properties, My requirements, Introductions, Market view, Plan.
   - AssetMeet team: Dashboard (control KPIs), Asset Bank, Demand Bank, Match Engine, Deal Desk, Opportunity Bank, Revenue, Members, Market view.
   - Selecting a listing opens the side panel (inline on wide screens) with Details, Introductions and Matches.
   - "List a property" and "Post a requirement" open the record form in the same panel (`app/record-form.tsx`).

## Data shown

Everything comes from the existing API. The reference's sample-only counters (views, visitors, saves, chat, featured placement) have no backend and are replaced by real equivalents: matches, Deal Desk introductions, status and plan usage. Photos are illustrative by property type and labelled as such.
