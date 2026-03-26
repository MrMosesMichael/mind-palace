# Mind Palace — Full Expansion Specification

## Vision

The Mind Palace is a **modular home management tool** — a knowledge warehouse for everything you maintain. Each "room" in the palace maps to a region of your home (garage, kitchen, bathroom, yard, etc.), and within each room you can schedule recurring tasks, store procedures/specs with linked resources, track inventory, manage recipes, and capture photos.

The app should feel like walking through a grand, atmospheric building where each room has its own character. The "Dreamcatcher" catches reminders before they slip through. The architecture is local-first (IndexedDB/Dexie) with optional server sync, and targets eventual deep integration with Apple ecosystem tools (Reminders, Calendar).

---

## Module Expansion

### Existing: Garage Module (keep as-is)
- Vehicles, mileage tracking, maintenance schedules
- Already complete and working

### New: Kitchen Module
- **type:** `kitchen`
- **label:** Kitchen
- **icon:** `flame` (use: 🔥)
- **roomLabel:** Kitchen Area / Appliance
- **roomPluralLabel:** Kitchen Areas
- **roomFields:**
  - `areaType` (select: full-kitchen, pantry, appliance, outdoor-grill)
  - `applianceBrand` (text, optional)
  - `applianceModel` (text, optional)
  - `purchaseDate` (date, optional)
- **trackingUnit:** null
- **scheduleTypes:** `['time', 'seasonal', 'manual']`
- **supplyCategories:** `['ingredient', 'tool', 'consumable']`
- **specFields:**
  - `temperature` (label: "Temperature", placeholder: "350°F / 175°C")
  - `cookTime` (label: "Cook Time", placeholder: "45 minutes")
- **defaultSchedules:**
  - Deep Clean Oven (every 3 months, medium priority)
  - Clean Range Hood Filter (every 1 month, low priority)
  - Replace Water Filter (every 6 months, high priority)
  - Clean Dishwasher (every 1 month, low priority)
  - Defrost Freezer (every 6 months, medium priority)

**Recipe System:** The kitchen module repurposes Procedures as Recipes in its UI:
- Procedure title → Recipe name
- Procedure description → Recipe description
- Procedure estimatedTime → Total cook time
- Procedure difficulty → Difficulty level
- Procedure tags → Dietary tags (vegetarian, gluten-free, etc.) + cuisine tags
- ProcedureStep → Recipe step (instruction field = step text)
- ProcedureStep specs → temp, time for that step
- Supply with category='ingredient' → Ingredients list (quantity, unit, name)
- Supply with category='tool' → Required equipment

The kitchen module should render `ProcedureList` / `ProcedureDetail` with recipe-specific UI:
- Ingredient list at top with checkboxes
- Servings adjuster (scales ingredient quantities)
- Timer integration per step
- Cook/prep time breakdown

### New: Yard & Garden Module
- **type:** `yard`
- **label:** Yard & Garden
- **icon:** `leaf` (use: 🌿)
- **roomLabel:** Zone
- **roomPluralLabel:** Zones
- **roomFields:**
  - `zoneType` (select: lawn, garden-bed, trees, patio, pool, shed, driveway)
  - `squareFootage` (number, optional, placeholder: "500")
  - `sunExposure` (select: full-sun, partial-shade, full-shade)
  - `soilType` (select: clay, sandy, loam, rocky)
- **trackingUnit:** null
- **scheduleTypes:** `['time', 'seasonal', 'manual']`
- **supplyCategories:** `['tool', 'material', 'consumable']`
- **specFields:**
  - `depth` (label: "Depth", placeholder: '2 inches')
  - `spacing` (label: "Spacing", placeholder: '12 inches apart')
- **defaultSchedules:**
  - Mow Lawn (every 1 week, medium priority, seasonal: Apr-Oct)
  - Fertilize (every 3 months, medium priority)
  - Trim Hedges (every 2 months, low priority)
  - Clean Gutters (every 6 months, high priority)
  - Winterize Irrigation (yearly, seasonal month: 10, critical priority)

### New: Bathroom Module
- **type:** `bathroom`
- **label:** Bathroom
- **icon:** `droplets` (use: 💧)
- **roomLabel:** Bathroom
- **roomPluralLabel:** Bathrooms
- **roomFields:**
  - `location` (text, placeholder: "Master, Hallway, Basement")
  - `hasShower` (select: yes, no)
  - `hasTub` (select: yes, no)
  - `fixtureAge` (text, optional, placeholder: "2018")
- **trackingUnit:** null
- **scheduleTypes:** `['time', 'seasonal', 'manual']`
- **supplyCategories:** `['tool', 'material', 'consumable']`
- **specFields:** (none)
- **defaultSchedules:**
  - Deep Clean (every 1 week, high priority)
  - Recaulk Shower (every 1 year, medium priority)
  - Replace Shower Head Filter (every 6 months, low priority)
  - Check for Leaks (every 3 months, medium priority)
  - Clean Exhaust Fan (every 3 months, low priority)

### New: Home Systems Module
- **type:** `home`
- **label:** Home Systems
- **icon:** `house` (use: 🏠)
- **roomLabel:** System
- **roomPluralLabel:** Systems
- **roomFields:**
  - `systemType` (select: hvac, plumbing, electrical, structural, roofing, insulation, security, smart-home)
  - `brand` (text, optional)
  - `model` (text, optional)
  - `installDate` (date, optional)
  - `warrantyExpires` (date, optional)
  - `serviceProvider` (text, optional, placeholder: "Bob's HVAC")
  - `servicePhone` (text, optional)
- **trackingUnit:** null
- **scheduleTypes:** `['time', 'seasonal', 'manual']`
- **supplyCategories:** `['tool', 'part', 'material', 'consumable']`
- **specFields:**
  - `filterSize` (label: "Filter Size", placeholder: '20x25x1')
  - `voltage` (label: "Voltage", placeholder: '240V')
- **defaultSchedules:**
  - Replace HVAC Filter (every 3 months, high priority)
  - Test Smoke Detectors (every 6 months, critical priority)
  - Flush Water Heater (every 1 year, medium priority)
  - Inspect Roof (every 1 year, high priority)
  - Service HVAC (every 1 year, high priority)
  - Test GFCI Outlets (every 6 months, medium priority)

---

## New Features

### 1. Enhanced Dashboard
The dashboard ("Hallway") should be the crown jewel:
- **Hero section** with greeting, date, and weather-aware message
- **Urgent reminders** (Dreamcatcher) more visual — status pills, progress rings
- **Module sections** with distinct visual identity per module type
- **Quick actions** — complete a task directly from dashboard without deep navigation
- **Upcoming this week** — horizontal scrollable timeline of next 7 days' tasks
- **Stats strip** — rooms count, active schedules, tasks completed this month

### 2. Global Search
- Accessible from every page (search icon in header or keyboard shortcut)
- Searches across: room names, schedule names, procedure titles, note content, reference titles
- Results grouped by type with clear visual hierarchy
- Recent searches remembered

### 3. Calendar View
- New top-level route: `/calendar`
- Month view showing scheduled tasks as dots/pills
- Day detail showing all tasks for that day
- Ability to complete tasks from calendar
- Color-coded by module type
- Add to bottom nav

### 4. Recipe UI (Kitchen Module)
When viewing procedures in a kitchen room, render them as recipes:
- Card layout with photo, title, cook time, difficulty, dietary tags
- Detail view: ingredients sidebar, step-by-step with timers
- Servings multiplier that scales ingredients
- "Start Cooking" mode: full-screen step-by-step walkthrough

### 5. Apple Ecosystem Architecture
- Existing .ics export works — keep and enhance
- CalDAV sync via Radicale already deployed — add UI to configure
- Architecture for future: EventKit bridge via Capacitor/native wrapper
- Settings page: "Connected Services" section showing CalDAV status

---

## Design Direction

### Identity & Mood
The Mind Palace should feel like a **well-crafted, personal workshop tool** — think of a beautifully organized workshop wall, a leather-bound journal, or a craftsman's reference book. It should NOT feel like a generic SaaS dashboard.

Key principles:
- **Warm and grounded** — the dark amber palette is a strong foundation, lean into it
- **Module personality** — each module should have its own accent color and subtle visual flavor
- **Spatial metaphor** — navigation should feel like moving through rooms
- **Texture over flat** — subtle gradients, soft shadows, grain textures to add depth
- **Information density** — show useful data at a glance, not just navigation tiles

### Module Color System
Each module has a primary accent and a subtle background tint:
- **Garage** (#4a7ec4 blue) — industrial, mechanical
- **Kitchen** (#c47a4a warm orange) — warm, culinary
- **Yard** (#5c8c4a green) — natural, organic
- **Bathroom** (#5ba3b5 teal) — clean, fresh
- **Home** (#8c6a9c purple) — structural, foundational

### Typography Hierarchy
- **Display/Page titles:** Georgia serif, 1.5rem+, letter-spacing -0.02em
- **Section headers:** Inter semibold, 1.125rem, uppercase tracking
- **Body:** Inter regular, 1rem, line-height 1.5
- **Labels/Meta:** Inter medium, 0.8125rem, text-secondary color
- **Mono/Specs:** JetBrains Mono, 0.875rem, for technical values

### Component Design
- **Cards:** Subtle left-border accent in module color, soft shadow, hover lift
- **Tiles (RoomDetail):** Replace flat tiles with richer cards that show preview data (e.g., "3 schedules, 1 overdue" or "12 photos")
- **Status indicators:** Use consistent pill badges (overdue=red, due-soon=amber, ok=green)
- **Empty states:** Module-specific messaging and appropriate icon
- **Forms:** Clean, spacious forms with clear field grouping
- **Navigation:** Bottom nav with module-colored active indicator

### Animations & Transitions
- Page transitions: subtle slide + fade (150-250ms)
- Card hover: translateY(-2px) + shadow elevation
- Status changes: color transitions (250ms ease)
- Loading states: skeleton screens, not spinners
- List enters: staggered fade-in

---

## Technical Constraints

1. **No new dependencies** for core features — leverage existing React, Dexie, CSS Modules stack
2. **Keep existing data models** — the Procedure/ProcedureStep/Supply model is sufficient for recipes
3. **CSS Modules + variables.css** for all styling — no styled-components or Tailwind
4. **Keep all existing functionality working** — this is an expansion, not a rewrite
5. **TypeScript strict mode** — all new code must be properly typed
6. **Mobile-first** — all new features must work on 375px+ viewport
7. **Keep PWA working** — service worker and offline support must not break

---

## File Structure for New Code

```
src/modules/
  kitchen.ts          # Kitchen module definition
  yard.ts             # Yard module definition
  bathroom.ts         # Bathroom module definition
  home.ts             # Home systems module definition
  index.ts            # Updated registry

src/components/
  calendar/
    CalendarView.tsx        # Month calendar grid
    CalendarDay.tsx         # Day cell with task dots
    CalendarDayDetail.tsx   # Expanded day view
  search/
    SearchOverlay.tsx       # Full-screen search overlay
    SearchResult.tsx        # Individual result item
  recipe/
    RecipeCard.tsx          # Recipe preview card
    RecipeDetail.tsx        # Full recipe view
    IngredientList.tsx      # Checkable ingredient list
    CookingMode.tsx         # Step-by-step cooking walkthrough
    ServingsAdjuster.tsx    # Servings multiplier
  dashboard/
    StatsStrip.tsx          # Quick stats bar
    WeekTimeline.tsx        # Horizontal upcoming week
    QuickAction.tsx         # Inline task completion

src/pages/
  Calendar.tsx              # Calendar page
  SearchResults.tsx         # Search results (if not overlay)
```

---

## Grading Criteria (for Evaluator reference)

| Criterion | Weight | What to evaluate |
|-----------|--------|-----------------|
| **Functionality** | HIGH | Can users navigate, create rooms in each module, create/complete schedules, view recipes, use calendar, search? Are flows intuitive? |
| **Design Quality** | MEDIUM-HIGH | Does it feel cohesive? Is there a clear mood/identity? Do colors, typography, layout work as a whole? |
| **Originality** | MEDIUM | Are there custom design decisions? Does it feel hand-crafted or templated? |
| **Craft** | MEDIUM-LOW | Typography hierarchy, spacing consistency, color harmony, contrast ratios |
