# AssetMeet design system

**Audience.** Expansion and real-estate heads at retail chains, banks and logistics firms (the paying clients), property owners and developers, and the engineers, architects and builders who contribute properties.

**Feel.** A credible local commercial-property advisory: calm, precise, factual. Closer to a property consultancy than a startup page. Light mode only.

**Direction source.** Built from the existing AssetMeet brand (green "am" wordmark, Manrope, DM Sans) and the audience above. It was not compared against reference sites; the UXKIN library was not connected when this was written.

All values live as CSS variables in `app/globals.css`. Pages use the variable names, never raw values.

## Color

| Token | Value | Role |
|---|---|---|
| `--ink` | `#15201b` | Headings and primary text |
| `--ink-2` | `#3d4a44` | Body text |
| `--muted` | `#5f6c66` | Secondary text, captions, labels |
| `--line` | `#dfe5e1` | Borders and dividers |
| `--line-strong` | `#c3cdc7` | Input borders, hovered borders |
| `--surface` | `#ffffff` | Cards, inputs, dialogs, marketing page background |
| `--bg` | `#f5f7f5` | Workspace background, alternate marketing bands |
| `--brand` | `#0b7a52` | Primary buttons, links, selected navigation |
| `--brand-strong` | `#075c3d` | Hover and pressed state of brand elements |
| `--brand-soft` | `#e4f2ea` | Selected rows, score backgrounds, soft badges |
| `--laterite` | `#a3441d` | Accent, used **only** for "Not yet listed" (pre-market supply). Named after the laterite stone Kerala buildings are made of |
| `--laterite-soft` | `#f8e9e1` | Background for the laterite badge |
| `--warning` / `--warning-soft` | `#8a5a00` / `#fbf0d9` | Pending permission, overdue follow-ups |
| `--danger` / `--danger-soft` | `#b42318` / `#fdecea` | Errors and destructive actions |
| `--ink-band` | `#13231c` | The one dark band on the landing page (contributors) |

Text on `--surface` and `--bg` meets 4.5:1. White text on `--brand` meets 4.5:1.

## Typography

- **Manrope** (600, 700) for headings and numbers that lead a card.
- **DM Sans** (400, 500, 600) for everything else.
- Body text 16px, line height 1.6, running text max 68 characters wide.
- Scale: `--fs-xs` 12 · `--fs-sm` 14 · `--fs-md` 16 · `--fs-lg` 18 · `--fs-xl` 22 · `--fs-2xl` 28 · `--fs-3xl` 36 · `--fs-4xl` clamp(36–54).
- Uppercase labels: 12px, 600, letter-spacing 0.08em.
- Digits that line up in tables use `font-variant-numeric: tabular-nums`.

## Spacing and layout

- 4-based scale: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 · `--s-8` 64 · `--s-9` 96.
- Content width 1200px; side gutter at least 16px (24px from tablet up).
- Marketing sections are separated by `--s-9` on desktop, `--s-8` on phones.
- Workspace: 240px labelled sidebar from 960px wide; bottom tab bar below that.

## Shape and depth

- Radius: `--r-sm` 6px (buttons, inputs, badges), `--r-md` 10px (cards, panels), `--r-pill` 999px (status pills).
- Shadows: `--shadow-1` for raised cards that float over a band (hero preview); `--shadow-2` for dialogs. Everything else is flat with a 1px border.

## Components

- **Buttons.** `.btn-primary` (brand fill, white text), `.btn-secondary` (white, strong border), `.btn-quiet` (text only). Minimum height 44px. Hover darkens or tints, focus shows a 3px brand outline offset 2px, disabled at 50% opacity. Labels say what happens ("Post a requirement", "Save property").
- **Links.** Brand colour, underline on hover.
- **Inputs.** 44px tall, `--line-strong` border, label above, help text below in `--muted`, error text in `--danger`.
- **Status pills.** Small rounded labels for construction, availability and verification. Laterite for "Not yet listed", warning for "Permission pending", brand-soft for "Mandate signed".
- **Score.** Manrope number in a brand-soft square; the reasons list beside it uses check (met) and alert (needs review) icons.
- **Cards and panels.** White, 1px `--line` border, `--r-md`. Used for records and grouped content only, not for every section.
- **Navigation.** Marketing: sticky white header, links collapse into a menu button below 900px. Workspace: labelled sidebar on desktop, bottom tab bar on phones.
- **Placeholder.** Dashed `--line-strong` box with a "To add" label. Marks content the business still has to supply (fees, contact details, proof). Never ship invented figures in its place.

## Imagery and icons

- Icons: `lucide-react`, 16–20px, stroke 1.75, always next to a text label (or with `aria-label`).
- No stock photography. Visuals are the product itself: real interface components rendered with clearly labelled fictional examples.
