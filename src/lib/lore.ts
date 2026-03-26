// The Mind Palace — Lore & Themed Copy
// All Dreamcatcher-themed strings live here for easy IP-stripping.
// Swap this file for a neutral version on the `clean` branch.

export const lore = {
  // App identity
  appName: 'The Mind Palace',
  appTagline: 'A knowledge warehouse for the things you maintain',

  // Navigation
  nav: {
    hallway: 'The Hallway',
    dreamcatcher: 'Dreamcatcher',
    calendar: 'Calendar',
    settings: 'Settings',
    addRoom: 'Open a New Room',
  },

  // Dashboard / Hallway
  hallway: {
    welcome: 'Welcome to the warehouse.',
    emptyState: 'The hallway is quiet. No rooms have been opened yet.',
    emptyAction: 'Open Your First Room',
    dreamcatcherEmpty: 'The Dreamcatcher has nothing to report.',
    dreamcatcherOverdue: 'The Dreamcatcher caught something.',
    dreamcatcherClear: 'All clear. Nothing slipping through.',
    greeting: {
      morning: 'Good morning.',
      afternoon: 'Good afternoon.',
      evening: 'Good evening.',
    },
  },

  // Rooms
  rooms: {
    emptyState: 'This room is empty. Start warehousing.',
    archived: 'Deep storage',
    newRoom: 'Open a new room in the warehouse',
    deleteConfirm: 'Close this room permanently? Everything inside will be lost.',
  },

  // Procedures (filing cabinets)
  procedures: {
    title: 'Filing Cabinet',
    emptyState: 'The filing cabinet is empty. Nothing has been warehoused here yet.',
    newProcedure: 'File a new procedure',
    steps: 'Steps',
    supplies: 'Supply List',
  },

  // Recipes (kitchen variant of procedures)
  recipes: {
    title: 'Recipe Book',
    emptyState: 'The recipe book is empty. No recipes have been written yet.',
    newRecipe: 'Write a new recipe',
    steps: 'Instructions',
    ingredients: 'Ingredients',
    equipment: 'Equipment',
    servings: 'Servings',
    prepTime: 'Prep Time',
    cookTime: 'Cook Time',
    totalTime: 'Total Time',
  },

  // Schedules
  schedules: {
    title: 'Schedules',
    emptyState: 'No schedules set. Nothing is being tracked.',
    overdue: 'Overdue — this one slipped through.',
    dueSoon: 'Coming up soon.',
    clear: 'Not due yet. Resting easy.',
  },

  // Task Log
  taskLog: {
    title: 'History',
    emptyState: 'No entries yet. The record is blank.',
    newEntry: 'Record what was done',
  },

  // Dreamcatcher (reminders)
  dreamcatcher: {
    title: 'The Dreamcatcher',
    subtitle: 'Catching what matters before it slips through.',
    emptyState: 'The web is empty. Nothing to catch right now.',
    acknowledged: 'Caught and handled.',
    overdue: 'This one slipped through the web.',
    upcoming: 'Caught in the web — approaching.',
    addToApple: 'Catch it in Apple Reminders',
  },

  // Photos
  photos: {
    title: 'Photo Wall',
    emptyState: 'No photos on the wall yet.',
    capture: 'Take a photo',
  },

  // References
  references: {
    title: 'Reference Shelf',
    emptyState: 'The shelf is empty. No references saved.',
    addReference: 'Shelve a reference',
  },

  // Inventory
  inventory: {
    title: 'Supply Shelf',
    emptyState: 'Nothing on the shelf.',
    lowStock: 'Running low.',
  },

  // Notes
  notes: {
    title: 'Notes',
    emptyState: 'No notes scribbled down yet.',
  },

  // Settings
  settings: {
    title: 'Settings',
    exportTitle: 'Pack Up the Warehouse',
    importTitle: 'Unpack a Backup',
    themeTitle: 'Atmosphere',
  },

  // Module-specific empty states
  moduleEmpty: {
    garage: {
      message: 'The garage is empty. No vehicles or equipment registered.',
      icon: '\uD83D\uDD27',
    },
    kitchen: {
      message: 'The kitchen is quiet. No areas or appliances catalogued yet.',
      icon: '\uD83D\uDD25',
    },
    yard: {
      message: 'The yard is untended. No zones have been mapped yet.',
      icon: '\uD83C\uDF3F',
    },
    bathroom: {
      message: 'The bathrooms are uncharted. No fixtures have been catalogued.',
      icon: '\uD83D\uDCA7',
    },
    home: {
      message: 'No home systems registered. The infrastructure is unmapped.',
      icon: '\uD83C\uDFE0',
    },
  } as Record<string, { message: string; icon: string }>,

  // Calendar
  calendar: {
    title: 'Calendar',
    emptyDay: 'Nothing scheduled for this day.',
    today: 'Today',
  },

  // Search
  search: {
    title: 'Search the Warehouse',
    placeholder: 'Search rooms, schedules, procedures...',
    noResults: 'Nothing found in the warehouse.',
    recentSearches: 'Recent Searches',
  },

  // General
  loading: 'Reaching into the warehouse...',
  saving: 'Filing away...',
  deleting: 'Removing from the warehouse...',
  error: 'Something went wrong in the warehouse.',
  confirmDelete: 'Are you sure? This cannot be undone.',

  // Easter eggs / random flavor
  tips: [
    'Every room tells a story.',
    'The warehouse remembers what you forget.',
    'File it now, thank yourself later.',
    'Knowledge warehoused is knowledge preserved.',
    'The Dreamcatcher catches what matters.',
    'A stitch in time saves nine. Schedule it.',
    'The best maintenance is preventive maintenance.',
    'An organized home is a peaceful home.',
    'Recipes are procedures for the kitchen.',
    'Every system needs a keeper.',
  ],
} as const;

/** Get a random tip from the lore */
export function getRandomTip(): string {
  return lore.tips[Math.floor(Math.random() * lore.tips.length)];
}

/** Get time-of-day greeting */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return lore.hallway.greeting.morning;
  if (hour < 17) return lore.hallway.greeting.afternoon;
  return lore.hallway.greeting.evening;
}
