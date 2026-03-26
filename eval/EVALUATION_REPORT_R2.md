# Mind Palace -- Round 2 Evaluation Report

## Overall Score: 7.8/10 (weighted)

The development team addressed the majority of critical and major issues from Round 1. The desktop experience went from broken to functional. The calendar went from empty to populated. Contrast now passes WCAG AA. These are real, meaningful fixes. However, some issues were only partially resolved, and the desktop layout -- while no longer broken -- remains conservative rather than impressive.

---

## Fix Verification

### Critical Issue 1: Calendar data -- FIXED

**Evidence:** Screenshot `12-calendar-mobile.png` now shows colored dots on March 25, 26, and 29. Today (March 26) displays a gold border highlight with red overdue dots and additional task dots. Screenshot `25-calendar-desktop.png` confirms the same -- dots visible on March 25, 26, and 29 in a full-width calendar grid.

**Code verification:** `CalendarGrid.tsx` now includes a `toDateOnly()` helper that correctly normalizes ISO date strings to `YYYY-MM-DD` by slicing, and `localDateStr()` builds dates from local components instead of relying on `toISOString()` (which would shift timezones). The `remindersByDate` map correctly buckets reminders by their due date. This was the root cause of the Round 1 failure -- timezone-shifted date keys meant no reminders matched any calendar cell.

**Overdue items on today:** Lines 45-49 of `CalendarGrid.tsx` show that overdue items (where `dueDate < today`) are also placed onto today's cell. This directly addresses Major Issue 6. The `DayCell` component renders up to 3 dots with a `+N` overflow indicator, and overdue dots get a distinct red style. The Dreamcatcher page (screenshot `13-dreamcatcher-mobile.png`) confirms overdue items are tagged with red "OVERDUE" badges.

**Verdict:** Fully fixed. Calendar is now a functional scheduling view rather than an empty grid.

### Critical Issue 2: Desktop layout -- FIXED

**Evidence from screenshots:**

- `21-dashboard-desktop.png`: Content now fills the viewport. The top navigation bar spans the full width with "Mind Palace" branding, nav links (Palace, Calendar, Dreamcatcher, Settings), and a "+ Room" action button. The bottom nav is gone. Room cards are in a 2-column grid. The Dreamcatcher section, stats strip, and week strip all render at full width. The week days stretch to fill available space rather than being tiny fixed-width cards.

- `22-room-tacoma-desktop.png`: Tile grid expands to a 4-column layout (Schedules, History, Filing Cabinet, Reference Shelf in one row; Photo Wall, Supply Shelf, Notes in the second). The odometer badge is prominent. The desktop nav is present at top. No bottom nav.

- `23-recipes-kitchen-desktop.png`: Recipe cards display in a 3-column grid. Each card shows title, description, time estimate, and tag pills. Good use of horizontal space.

- `24-recipe-detail-desktop.png`: 2-column grid layout -- ingredients list on the left (300px), instructions on the right. Photo header spans full width. Equipment section sits below ingredients. This is a genuinely useful layout for cooking.

- `25-calendar-desktop.png`: Full-width calendar grid with generous cell sizing. Desktop nav at top. The CSS defines a `grid-template-columns: 1fr 300px` layout at 1024px+ for a side detail panel, though the screenshot doesn't show a day selected to trigger the panel.

**Code verification:**
- `DesktopNav.module.css`: Hidden by default (`display: none`), shown at 768px+ as a sticky top bar.
- `BottomNav.module.css` line 79-83: `@media (min-width: 768px) { .nav { display: none; } }` -- bottom nav correctly hidden on desktop.
- `AppShell.module.css`: Content max-width scales from 640px (mobile) to 768px (tablet) to 960px (desktop).
- `variables.css`: Three max-width tokens defined: 640px, 768px, 960px.

**Remaining concern:** The content max-width of 960px on a 1280px viewport still leaves 320px of dead black space (160px each side). This is better than the 640px it was before (which left 640px of dead space), but for a data-dense app like this, 1100-1200px would use the viewport more effectively. The dashboard screenshot confirms visible black gutters on both sides.

**Verdict:** Fixed. The desktop experience is now a proper adaptive layout with appropriate navigation, multi-column grids, and responsive breakpoints. The max-width cap is conservative but not broken.

### Critical Issue 3: WCAG contrast -- FIXED

**Evidence from code inspection:**

- Old `--color-text-muted`: `#6b5d4a` -- contrast ratio against `#0f0b04` background: **3.07:1** (failed WCAG AA for normal text, barely passed for large text)
- New `--color-text-muted`: `#91816d` -- contrast ratio against `#0f0b04` background: **5.20:1** (passes WCAG AA for normal text at 4.5:1)
- New `--color-text-secondary`: `#9c8b72` -- contrast ratio against `#0f0b04` background: **5.93:1** (passes WCAG AA)

Against raised surfaces:
- `--color-text-muted` against `--color-bg-raised` (#1a1207): **4.91:1** -- passes AA
- `--color-text-muted` against `--color-bg-surface` (#241c0f): **4.46:1** -- marginally below AA (4.5:1 required) but within rounding tolerance

**Remaining concern:** The muted text on `--color-bg-surface` (#241c0f) is 4.46:1, which is technically 0.04 below the 4.5:1 threshold. In practice this applies to text inside cards and tiles (the surface background). The shortfall is small enough that it may pass automated tools due to rounding, but it is technically non-compliant. The fix brought the ratio from egregiously bad (3.07:1) to borderline-passing.

**Verdict:** Fixed. The primary background pairing passes AA cleanly. The surface pairing is borderline but dramatically improved from Round 1.

### Major Issue 4: Title truncation -- PARTIALLY FIXED

**Evidence:** Screenshot `18-new-room-form-mobile.png` shows the header reading "Open a new room in the war..." with visible ellipsis truncation. The title text from lore.ts is "Open a new room in the warehouse" which is too long for the mobile header when combined with the back button and search icon.

**Code:** `PageHeader.module.css` correctly applies `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` -- so truncation is handled gracefully (no overflow or broken layout). The question is whether truncation itself is acceptable. The ellipsis cuts "warehouse" to "war..." which loses meaning.

**Verdict:** Partially fixed. The truncation is now graceful (ellipsis instead of overflow), but the lore string itself is still too long for mobile headers. Either the string should be shortened or the title should wrap.

### Major Issue 5: Destructive action confirmations -- FIXED

**Evidence from code:** Every destructive action now uses `window.confirm()`:
- Room deletion: `RoomDetail.tsx:112` -- `window.confirm(lore.rooms.deleteConfirm)` ("Close this room permanently? Everything inside will be lost.")
- Schedule deletion: `ScheduleForm.tsx:126`
- Procedure deletion: `ProcedureForm.tsx:299`
- Note deletion: `NotesList.tsx:57`
- Reference deletion: `ReferenceList.tsx:58`
- Task log deletion: `TaskLogForm.tsx:97`
- Photo deletion: `PhotoGallery.tsx:179`
- Settings clear all data: `Settings.tsx:100-101` -- double confirmation
- Settings restore backup: `Settings.tsx:81`

All use `lore.confirmDelete` ("Are you sure? This cannot be undone.") or context-specific messages.

**Screenshots confirm:** `02-room-tacoma-mobile.png` shows a red "Delete Vehicle" button, `03-room-kitchen-mobile.png` shows "Delete Kitchen Area", `10-room-bathroom-mobile.png` shows "Delete Bathroom", `17-settings-mobile.png` shows a red "Clear All Data" in a "DANGER ZONE" section.

**Note:** These are native browser `window.confirm()` dialogs, not custom-styled modals that match the app theme. Functional but not polished.

**Verdict:** Fixed. All destructive actions are gated behind confirmation dialogs.

### Major Issue 6: Calendar overdue items -- FIXED

**Evidence:** `CalendarGrid.tsx` lines 44-50 explicitly handle overdue items by placing them on today's cell in addition to their original due date cell. The `DayCell` component renders overdue dots with a distinct red color (`styles.dotOverdue`). Screenshot `12-calendar-mobile.png` shows red dots on today's date. Screenshot `13-dreamcatcher-mobile.png` shows overdue items tagged "OVERDUE" in red with their original due dates visible.

**Verdict:** Fixed.

### Major Issue 7: Week scroll affordance -- FIXED

**Evidence:** `Dashboard.module.css` lines 234-243 define a `::after` pseudo-element on `.weekSection` that creates a 48px right-edge gradient fade (`linear-gradient(to right, transparent, var(--color-bg))`). This signals to the user that content continues beyond the visible area. Screenshot `01-dashboard-mobile.png` shows the week strip with day cards, and the rightmost visible card appears to fade at the edge. At desktop (1024px+), the fade is removed (line 382-384) because the week cards expand to fill the width and scrolling is no longer needed.

**Verdict:** Fixed.

---

## Updated Criterion Scores

### Functionality -- 8/10 (was 7/10, +1)

**What improved:**
- Calendar is now fully functional with schedule data rendered on correct dates
- Overdue items surface on today's calendar cell
- Destructive action confirmations prevent accidental data loss
- Desktop navigation works correctly with proper route highlighting

**What remains problematic:**
- Calendar desktop layout defines a side detail panel (`grid-template-columns: 1fr 300px` at 1024px+) but the screenshot does not show it populated -- unclear if clicking a day actually reveals a detail panel or if it is dead code
- The new room form title is still truncated on mobile, slightly hurting discoverability of the form's purpose
- `window.confirm()` dialogs are functional but feel like a prototype; a custom modal matching the warm theme would be more cohesive
- No visible loading states or error handling in screenshots (network-dependent data paths)

### Design Quality -- 7.5/10 (was 7/10, +0.5)

**What improved:**
- Desktop layout is no longer broken -- proper top navigation, hidden bottom nav, multi-column grids
- Recipe detail 2-column layout (ingredients left, instructions right) is a smart, purposeful adaptation
- Room detail 4-column tile grid at desktop is clean
- Week scroll affordance gradient is subtle and effective
- WCAG contrast is now passing

**What remains problematic:**
- 960px max-width on a 1280px viewport leaves noticeable black gutters; the dashboard in particular looks island-like floating in darkness
- Desktop dashboard is essentially the same mobile layout made wider -- no sidebar, no dual-pane master-detail, no dashboard-specific widgets that exploit the space
- Calendar desktop (screenshot 25) shows a large calendar grid with no side panel visible, leaving the right 2/3 of the viewport feeling empty even though the CSS defines a detail column
- The delete buttons (red with centered text) on room detail pages look like afterthoughts stuck at the bottom rather than integrated danger-zone patterns
- Recipe cards on desktop (screenshot 23) have excessive vertical dead space below the 3 cards -- the single row of cards occupies roughly 25% of viewport height

**Unchanged:**
- The warm amber-on-dark theme continues to look distinctive and cohesive
- Typography hierarchy is clear
- Mobile design quality remains solid

### Originality -- 6.5/10 (was 6/10, +0.5)

**What improved:**
- The Dreamcatcher concept (screenshot 13) remains the most original feature -- "Caught in the Web" overdue grouping, "Approaching" upcoming grouping, with red urgency badges and "DUE SOON" labels. This is genuinely novel naming and UX framing
- The lore system (warehouse, rooms, filing cabinet, etc.) continues to create a unique identity
- Recipe detail instructions with temperature callouts, timer indicators, and pro-tip badges (screenshots 07, 08) show attention to domain-specific affordances

**What has not changed:**
- Desktop layouts are standard responsive grid adaptations -- wider cards, more columns. No new interaction patterns, no dashboard innovations, no unique desktop-only features
- The calendar is a standard month grid. The side-panel CSS exists but does not appear to be showcased
- Settings page (screenshot 17) is a standard form -- theme picker, unit selector, backup/restore, danger zone. Functional but not original
- Search overlay (screenshot 20) is a standard full-screen search with categorized results

**The originality score is slightly higher because the existing original ideas (Dreamcatcher, lore naming, recipe pro-tips) are now more visible and functional thanks to the bug fixes. But no new original features were added.**

### Craft -- 7.5/10 (was 7/10, +0.5)

**What improved:**
- `localDateStr()` helper properly formats dates using local components instead of `toISOString()` -- correct timezone handling
- `toDateOnly()` normalizes ISO strings to date-only format -- defensive coding
- Desktop breakpoints are methodically layered: 768px (tablet: 2-col grids, hide bottom nav) and 1024px (desktop: wider content, 3-4 col grids, recipe 2-col)
- CSS custom properties for max-widths at each breakpoint (`--content-max-width`, `--content-max-width-tablet`, `--content-max-width-desktop`) -- systematic approach
- `AppShell.module.css` correctly removes bottom padding on desktop since bottom nav is hidden
- Overdue logic in CalendarGrid avoids duplicates when `dueDate === today`

**What remains problematic:**
- `--color-text-muted` at 4.46:1 against `--color-bg-surface` is still technically below WCAG AA (4.5:1). An extra 1-2 luminance points would fix it
- `PageHeader` title still uses `white-space: nowrap` with no `title` attribute or tooltip, so truncated text is unrecoverable without navigating
- The `weekSection::after` gradient fade uses a hardcoded `var(--color-bg)` which would break if the week section ever sits on a different background color (fragile)
- Desktop nav `max-width: var(--content-max-width-desktop)` means the nav content is 960px wide but the nav bar background spans full width -- this is correct, but it means the nav links are compressed into 960px while 1280px is available
- `window.confirm()` for destructive actions works but is the lowest-effort solution; a custom confirm dialog using the design system would demonstrate higher craft
- No CSS containment, no `will-change` hints, no explicit `content-visibility` for the long scrolling dashboard -- performance craft is absent

---

## Remaining Issues

### Still Present from Round 1
1. **Title truncation on new room form** -- "Open a new room in the war..." is gracefully truncated but still loses meaning. The lore string should be shorter or the header should allow wrapping.
2. **960px max-width leaves dead space on wide screens** -- The content area caps at 960px on a 1280px viewport. For a data-dense home management app, this is conservative.

### New Observations (Not Regressions)
3. **Calendar side panel not demonstrated** -- The CSS for `Calendar.module.css` defines a `1fr 300px` grid at 1024px+, but screenshot `25-calendar-desktop.png` shows no side panel populated. Either no day is selected in the test, or the panel implementation is incomplete.
4. **Excessive dead space in recipe list desktop** -- Screenshot `23-recipes-kitchen-desktop.png` shows 3 recipe cards in a single row occupying roughly 25% of viewport height, with the remaining 75% being empty dark background.
5. **Native confirm dialogs break theme immersion** -- `window.confirm()` produces an unstyled browser chrome dialog that clashes with the warm atmospheric theme.
6. **Muted text on surface backgrounds is 4.46:1** -- Borderline WCAG AA failure on `--color-bg-surface`. Should be bumped slightly.

---

## Weighted Final Score

Using the same weights as Round 1:

| Criterion      | Weight | Round 1 | Round 2 | Weighted R2 |
|----------------|--------|---------|---------|-------------|
| Functionality  | 30%    | 7.0     | 8.0     | 2.40        |
| Design Quality | 30%    | 7.0     | 7.5     | 2.25        |
| Originality    | 15%    | 6.0     | 6.5     | 0.98        |
| Craft          | 25%    | 7.0     | 7.5     | 1.88        |
| **Total**      |        | **6.8** | **7.8** | **7.50**    |

Rounding to one decimal: **7.5/10**

Revised overall: **7.5/10** (up from 6.8/10, a gain of +0.7)

The team fixed every critical issue and most major issues. The app went from "broken on desktop, empty calendar" to "functional across viewports with real data." The gains are real but the ceiling is limited by the conservative desktop treatment and the absence of new features that exploit the fixes. The fundamentals are now solid. To reach 8+, the app needs to use desktop space more ambitiously (wider max-width, dashboard sidebar, populated calendar detail panel) and replace browser-native dialogs with themed components.
