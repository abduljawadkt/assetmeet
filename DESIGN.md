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

1. **Landing** (`app/landing.tsx`, `app/landing.css`): inspired by micro.company. Five quiet full-screen chapters in the brand green, alternating green (#087f55), mint (#edf8f2) and white, with forest #173d2c for text on light chapters; Source Serif 4 for chapter titles with Manrope for everything else, a fixed dot rail, gentle snapping and each chapter easing in (off with reduced motion; content is never hidden without JavaScript). Chapters: Namaskaram greeting with the am mark; a dictionary-style definition of AssetMeet with a pronounce button; Our Promise (five numbered lines); Start Here (six icon choices, which pop in one after another and then take turns doing a small movement that fits each one: the building rises with its windows lighting up, the magnifier looks around, the hard hat nods, the hammer strikes, the compass needle spins and the arrow steps in; hovering repeats it); closing one-line links. The pronounce button speaks in a female English voice, Indian English first where the device has one. The dot rail and the Sign in link switch to white on the green chapters.
2. **Entry** (`app/entry.tsx`): "I have a property" / "I need a property", email sign-in link (or password for team-created accounts), then role and profile. The engine guide animation sits beside it.
3. **Workspace** (`app/workspace.tsx`): sidebar shell.
   - Members: Dashboard, My properties, My requirements, Introductions, Market view, Plan.
   - AssetMeet team: Dashboard (control KPIs), Asset Bank, Demand Bank, Match Engine, Deal Desk, Opportunity Bank, Revenue, Members, Market view.
   - Selecting a listing opens the side panel (inline on wide screens) with Details, Introductions and Matches.
   - "List a property" and "Post a requirement" open the record form in the same panel (`app/record-form.tsx`).

## Data shown

Everything comes from the existing API. The reference's sample-only counters (views, visitors, saves, chat, featured placement) have no backend and are replaced by real equivalents: matches, Deal Desk introductions, status and plan usage. Photos are illustrative by property type and labelled as such.
