# Mind Palace — Adversarial Evaluation Report

## Overall Score: 6.6/10 (weighted)

## Screenshots Reviewed: 25 of 25

---

## Criterion Scores

### 1. Functionality — 7/10 (40%)

**What works:**

- The dashboard (01-dashboard-mobile.png) is information-dense in a productive way. At a glance you can see room counts, active schedules, tasks completed this month, overdue items, and upcoming week. That is a genuinely useful landing page for a home-maintenance app.
- The Dreamcatcher concept (13-dreamcatcher-mobile.png) provides a clear triage view. Overdue items are visually separated from upcoming items. Status pills ("OVERDUE", "DUE SOON") are effective at communicating urgency. The division into "slipped through the web" and "caught in the web" is easy to parse once you understand the metaphor.
- Search (20-search-overlay-mobile.png) is thorough. It searches across rooms, schedules, procedures, notes, and references. Results are grouped by type with clear labels. The debounced search with 200ms delay is a good implementation choice.
- Recipe detail (07-recipe-detail-steak-mobile.png, 08-recipe-detail-sourdough-mobile.png) is genuinely usable as a cooking reference. Temperature callouts, cook time chips, tip/warning boxes, and a servings adjuster with ingredient scaling are all present. The numbered step list with inline specs is practical.
- Quick-complete buttons on the dashboard reminders allow marking tasks done without navigating away. That is a smart UX shortcut.
- The new schedule form (19-new-schedule-form-mobile.png) has sensible fields: trigger type, interval, priority, last-completed date seeding. The "Show suggested schedules" link is a useful feature for onboarding.
- Room detail pages (02-room-tacoma-mobile.png) provide a clear tile grid for sub-sections (Schedules, History, Filing Cabinet, etc.) with badge counts showing items that need attention.

**What is broken or confusing:**

- The calendar (12-calendar-mobile.png, 25-calendar-desktop.png) is essentially empty. No events are displayed on any day despite the app having multiple overdue and upcoming schedules. The calendar grid shows no dots, no indicators, nothing. Without clicking each day one by one, the calendar communicates zero information. This is a significant functional gap -- the calendar should be pre-populated with schedule due dates.
- The calendar has no day-detail panel visible in any screenshot. Selecting a date apparently shows tasks for that day, but only if `nextDueDate` exactly matches. Overdue items that have passed will never show on any day. This makes the calendar nearly useless for understanding past-due work.
- The new room form (18-new-room-form-mobile.png) title is cut off: "Open a new room in the wareho\[use\]". The page title text is too long for the header and gets truncated with no ellipsis visible. This looks broken.
- The task log (14-task-log-mobile.png) shows only two entries with no indication of how to filter, sort, or search. For a "History" feature, the lack of filtering by date range or type makes it impractical at scale.
- References (15-references-mobile.png) show items with an "X" button but no confirmation dialog is visible. One accidental tap could delete a reference.
- Notes (16-notes-mobile.png) shows "Unpin / Edit / Delete" inline on the card. These are destructive actions exposed without any confirmation gate, and the tap targets appear small.
- The Photo Wall and Supply Shelf tiles appear in every room detail but no screenshots show them populated. If these features are empty shells, they should not be so prominently placed in the UI.
- Desktop layouts (21-25) show the bottom navigation bar stretched across the full 1280px width. On desktop, a bottom nav is an inappropriate pattern -- it wastes prime screen real estate and looks like a mobile app running on a monitor rather than a responsive web app.

**Score justification:** Core CRUD flows work. The dashboard is genuinely functional. Recipe detail is strong. But the calendar is functionally hollow, desktop navigation is inappropriate, and several features appear incomplete (Photo Wall, Supply Shelf). A 7 reflects that primary tasks are accomplishable but secondary features have real gaps.

---

### 2. Design Quality — 7/10 (30%)

**What is cohesive:**

- The warm dark palette is consistent throughout. Every screenshot shares the same `#0f0b04` background with amber `#d4a34a` accents. The color token system in `variables.css` is well-structured with semantic naming (`--color-bg-raised`, `--color-bg-surface`, `--color-bg-hover`) that creates clear visual hierarchy.
- Module accent colors (garage=blue, kitchen=orange, yard=green, bathroom=teal, home=purple) provide subtle differentiation. The left-border accent on room cards in the dashboard (01-dashboard-mobile.png) ties the color system to actual UI elements.
- Typography uses three intentional tiers: Georgia for display/section headers, Inter for body, JetBrains Mono for data values (odometer readings, stats). This is a considered choice that adds character.
- The "raised surface" pattern (dark cards on darker background) creates visual depth without resorting to heavy shadows or neon glows.
- The Dreamcatcher section on the dashboard uses a warning-amber title color and overdue-red pills that correctly signal urgency without clashing with the warm ambient palette.

**What is disjointed:**

- The desktop experience (21-dashboard-desktop.png) is the weakest design surface. Content is constrained to 640px max-width, leaving enormous black gutters on either side. At 1280px, roughly 50% of the screen is unused void. This is not "responsive design" -- it is "mobile design shown on a bigger screen."
- The room detail desktop view (22-room-tacoma-desktop.png) is particularly bad. The tile grid has six tiles occupying a narrow column in the center of a vast dark canvas. There is no sidebar, no expanded layout, no additional information taking advantage of the wider viewport.
- The recipe list at desktop (23-recipes-kitchen-desktop.png) is marginally better because the cards take more horizontal space, but the single-column layout still wastes the viewport.
- Information density drops sharply on desktop. The mobile dashboard (01-dashboard-mobile.png) requires scrolling but fills the viewport purposefully. The desktop version (21-dashboard-desktop.png) is the same content swimming in darkness.
- The emoji-based icons (wrench, flame, leaf, droplet) are functional but create visual inconsistency across platforms. On different OS/browser combos these will render differently. There are no SVG or icon-font fallbacks.

**Score justification:** The design has genuine identity on mobile. The color system is professional and the warm-dark atmosphere is distinctive. But the desktop experience is neglected to the point of looking unfinished. A cohesive mobile design with a broken desktop experience averages to a 7.

---

### 3. Originality — 6/10 (20%)

**What feels custom:**

- The "Mind Palace / Warehouse / Dreamcatcher" metaphor is original and well-executed in copy. The `lore.ts` file shows a consistent thematic vocabulary: rooms are "opened," schedules "slip through the web," data is "warehoused," settings include "Pack Up the Warehouse" and "Unpack a Backup." This is not generic CRUD language.
- The warm amber-on-dark palette is a deliberate aesthetic choice that avoids the standard dark-mode tropes (blue-on-dark-gray, or purple-gradient). The color temperature feels like dark wood and candlelight, which supports the "palace" metaphor.
- The Dreamcatcher concept as a unified reminder/triage view is a genuinely useful UX invention. It is not just a renamed "notifications" page -- it aggregates overdue and upcoming items from all modules with contextual quick-complete actions.
- The recipe detail with inline temperature/time chips and warning/tip callouts (07-recipe-detail-steak-mobile.png) goes beyond a basic recipe app. The "Use coarse kosher salt for best crust" and "Don't touch it! Let the Maillard reaction do its work" tips show domain knowledge in the seed data.
- Module-specific room types (Garage with odometer tracking, Kitchen with recipe books, Yard with zones) show structural variety rather than one-size-fits-all rooms.

**What feels generic or AI-generated:**

- The dashboard layout follows the exact template of every "modern dashboard" ever generated by AI: greeting + stats strip + urgent alerts + scrollable sections grouped by category. The structure is competent but not surprising. There is no spatial innovation -- no grid experimentation, no progressive disclosure, no contextual layout changes.
- Card-based layouts everywhere. Room cards, schedule cards, recipe cards, reference cards, note cards. The entire UI is flat rectangles with rounded corners stacked vertically. This is the default React component pattern and nothing breaks out of it.
- The stats strip ("9 Rooms / 11 Schedules / 2 Done this month") is the archetypal AI-generated dashboard hero section. It communicates real data, but the visual treatment (centered numbers, tiny labels, dividers) is indistinguishable from a Tailwind template.
- The calendar is a basic month grid with no visual identity. Compare it to any calendar tutorial on the web -- it looks identical. No texture, no integration with the palace metaphor.
- The settings page (17-settings-mobile.png) is entirely standard: theme dropdown, unit selector, lead-time input, backup buttons. No design personality whatsoever. Even the "Danger Zone" section with a red "Clear All Data" button is a GitHub-isms cliche.
- The bottom nav with icons + labels is the mobile app starter kit pattern. Palace icon, calendar icon, plus button, dreamcatcher icon, settings gear. There is nothing wrong with this, but there is nothing distinctive about it either.
- The section header pattern (UPPERCASE SMALL TEXT + BORDER-BOTTOM) is repeated identically on every page. It is a reasonable typographic choice applied so uniformly that it becomes monotonous.

**Score justification:** The thematic copy and color palette show real creative direction. The Dreamcatcher concept and recipe detail features show domain thinking. But the layout patterns, component shapes, and page structures are entirely conventional. The originality is in the surface treatment and copy, not in the interaction design or information architecture. A 6 reflects "above average theming on a standard skeleton."

---

### 4. Craft — 7/10 (10%)

**What is polished:**

- Typography hierarchy is consistent. Display headings use Georgia, section titles use uppercase 0.875rem with 1px letter-spacing, body text is 0.9375rem Inter, muted labels are 0.6875rem. This system is applied uniformly across all pages reviewed.
- The spacing token system (`--space-xs` through `--space-2xl`) is used consistently in CSS modules. I found no magic numbers in the stylesheets reviewed. Gap, padding, and margin values all reference the token scale.
- Color contrast appears acceptable. Primary text (`#e8dcc8`) on background (`#0f0b04`) provides high contrast. Secondary text (`#9c8b72`) on the dark background is lower contrast but still readable. Muted text (`#6b5d4a`) approaches problematic contrast ratios for small text -- this should be verified with WCAG tooling.
- The CSS architecture is clean. CSS modules prevent class collisions. Variables are imported once at the root. No inline styles except for dynamic values (module accent colors). No `!important` flags found.
- Transitions are defined as tokens (`--transition-fast: 150ms`, `--transition-normal: 250ms`) and applied consistently for hover states and page entrances.
- The `env(safe-area-inset-bottom)` padding on the bottom nav shows awareness of notched devices.
- Touch target sizes reference `--touch-target: 44px` which meets Apple's HIG minimum.

**What has broken fundamentals:**

- The `--color-text-muted: #6b5d4a` on `--color-bg: #0f0b04` likely fails WCAG AA for small text. Muted labels throughout the app (stat labels, section counts, day-of-week headers, tag text) use this combination. This is a systemic accessibility concern.
- The page header title truncation (18-new-room-form-mobile.png) is a layout bug. Long titles should either wrap, use a smaller font size, or show an ellipsis cleanly. The current rendering just clips.
- Desktop layouts have no media queries expanding the grid. The `--content-max-width: 640px` is hardcoded with no breakpoint override. The room tile grid is always 2 columns. The recipe list is always single-column. The calendar grid does not expand cells. This is not responsive design -- it is a single layout at a fixed width.
- Some emoji icons appear small and hard to distinguish at the sizes used. The 40x40 icon badge on room cards (RoomCard.module.css) renders emoji at a size where details are lost.
- The `weekScroll` on the dashboard hides the scrollbar entirely (`::-webkit-scrollbar { display: none }`). On mobile this is fine (touch scrolling is expected), but there is no visible affordance that this section scrolls horizontally. A user might not realize there are more days to the right.
- Light mode tokens exist in `variables.css` but the settings page only shows "Dark (Canonical)" as the theme option. If light mode is not ready, the tokens should not be shipped -- or the setting should clearly indicate it is WIP.

**Score justification:** The token system and typography hierarchy demonstrate real craft. The CSS architecture is professional. But accessibility contrast issues, the missing responsive breakpoints, and the truncated header are craft failures. A 7 reflects strong foundations with measurable gaps.

---

## Critical Issues (must fix)

1. **Calendar shows no schedule data.** The calendar view (12, 25) displays an empty grid despite the app having active schedules with due dates. This makes the Calendar tab functionally worthless. The `CalendarGrid` component receives reminders but days show no dots or indicators.

2. **Desktop layout is essentially broken.** All five desktop screenshots (21-25) show mobile-width content centered in a vast black void. There are no responsive breakpoints, no expanded layouts, no sidebars, no multi-column grids. At 1280px, 50%+ of the viewport is wasted. The bottom navigation bar stretched across full desktop width is particularly inappropriate.

3. **Muted text color likely fails WCAG AA contrast.** `#6b5d4a` on `#0f0b04` has a contrast ratio of approximately 3.1:1 -- below the 4.5:1 minimum for normal text. This affects stat labels, section counts, muted descriptions, and day-of-week headers across the entire app.

## Major Issues (should fix)

4. **Page header title truncation.** The new-room form title "Open a new room in the wareho..." (18-new-room-form-mobile.png) is visually broken. Long titles need an overflow strategy.

5. **No confirmation for destructive actions.** Reference deletion (15-references-mobile.png) shows an X button with no confirmation. Note inline actions (16-notes-mobile.png) expose "Delete" directly. Room deletion buttons (02-10) are visible but unclear if they have confirmation gates.

6. **Photo Wall and Supply Shelf are empty shells.** These tiles appear prominently in every room detail but appear to have no content or functional screenshots. Features that are stubs should either be hidden or clearly marked as "coming soon."

7. **Calendar has no way to view overdue items.** The calendar only shows items where `nextDueDate` exactly matches the selected day. Past-due items that were never completed will not appear on any past or future date, making them invisible in this view.

8. **Horizontal week scroll has no affordance.** The upcoming-week section on the dashboard (01-dashboard-mobile.png) scrolls horizontally but hides the scrollbar entirely. Users may not discover the content extends beyond the viewport.

## Minor Issues (nice to fix)

9. **Emoji icons render inconsistently across platforms.** The app relies on OS-native emoji for all icons (wrench, flame, leaf, cooking pot, calendar). Consider SVG icons for consistency and better rendering at small sizes.

10. **Settings page "Danger Zone" naming.** The red "Clear All Data" section labeled "DANGER ZONE" (17-settings-mobile.png) is directly copied from GitHub's UI conventions. Not necessarily wrong, but not original.

11. **Light mode exists in tokens but is not accessible.** The `variables.css` file has a complete `[data-theme="light"]` token set, but the settings dropdown only shows "Dark (Canonical)." Either expose the feature or remove the dead code.

12. **Section header monotony.** Every page uses the identical UPPERCASE + BORDER-BOTTOM + 0.875rem section header. Some visual variety in section demarcation would reduce the sense of template repetition.

13. **The "Dreamcatcher" metaphor requires learning.** New users will not immediately understand that "Dreamcatcher" means "reminders" or that "The Hallway" means "dashboard." While thematic copy is charming for power users, there is no onboarding or tooltip to bridge the gap.

14. **Task log has no filtering capabilities.** The History page (14-task-log-mobile.png) is a flat chronological list. For a maintenance app where history matters, filtering by room, date range, or type would be essential at scale.

15. **Recipe photo headers are all identical placeholders.** Both the steak recipe (07) and sourdough recipe (08) show the same generic cooking-pot emoji in an orange gradient box. Distinct recipe photos or at minimum varied placeholder illustrations would differentiate recipes visually.

---

## What Works Well

- **The Dreamcatcher dashboard section is genuinely useful.** Aggregating overdue and upcoming items from all rooms with quick-complete buttons is a smart UX pattern that saves real clicks. The status pills provide instant triage.

- **Recipe detail is the star feature.** The cast iron steak recipe (07-recipe-detail-steak-mobile.png) with temperature chips, cook-time specs, warning callouts ("Don't touch it!"), and tip boxes ("Use coarse kosher salt") is more detailed and usable than most dedicated recipe apps. The servings adjuster with proportional ingredient scaling is a thoughtful feature.

- **The lore system is well-architected.** Centralizing all themed copy in `lore.ts` with a clean export structure is smart engineering. It enables theming/white-labeling while keeping the Dreamcatcher IP self-contained.

- **The color token system is professional.** Five levels of background darkness, three levels of text brightness, semantic status colors, module accent colors with background tints -- this is a well-designed design-token architecture.

- **The CSS module architecture is clean.** No global class conflicts, consistent use of design tokens, no inline style hacks, proper use of CSS custom properties for dynamic theming (module accent colors passed as CSS variables via React style props).

- **Search is comprehensive.** Searching across five entity types with grouped, labeled results and debounced input is thorough for a v1.

- **The mobile experience is genuinely solid.** On a 390px viewport, the information density is appropriate, touch targets meet minimum sizes, and the vertical scroll flow is natural. This app was clearly designed mobile-first, and that mobile experience delivers.

---

## Weighted Final Score

| Criterion | Score | Weight | Weighted |
|---|---|---|---|
| Functionality | 7/10 | 0.40 | 2.80 |
| Design Quality | 7/10 | 0.30 | 2.10 |
| Originality | 6/10 | 0.20 | 1.20 |
| Craft | 7/10 | 0.10 | 0.70 |
| **TOTAL** | | | **6.80/10** |

---

## Summary Verdict

Mind Palace is a competent, mobile-first home-maintenance app with a distinctive thematic identity and one genuinely excellent feature (recipe detail). The warm amber-on-dark palette, the Dreamcatcher metaphor, and the centralized lore system show creative direction above the AI-generated baseline.

However, it falls short in three significant ways: (1) the calendar feature is functionally empty, (2) the desktop experience is neglected to the point of looking unfinished, and (3) the interaction patterns and layouts are conventional card-based React with no structural innovation. The originality is skin-deep -- good theming on a standard skeleton.

The app earns its score through solid mobile UX, a professional token/CSS architecture, and the recipe feature. It loses points for the broken calendar, desktop neglect, contrast accessibility issues, and a pervasive "every AI app looks like this" layout vocabulary. To reach a 7.5+, the calendar needs real data visualization, the desktop needs dedicated layouts, and at least one page needs to break out of the vertical-card-list mold.
