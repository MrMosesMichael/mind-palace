/**
 * Mind Palace Evaluator — Seed Data + Screenshot Script
 *
 * Seeds auth tokens and sample data into the app via Playwright,
 * then navigates through every major page and takes screenshots.
 *
 * Usage: node eval/seed-and-screenshot.mjs [base-url]
 */

import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, 'screenshots');
const BASE_URL = process.argv[2] || 'http://localhost:4174';

// Viewport for mobile-first evaluation
const MOBILE_VP = { width: 390, height: 844 };
const DESKTOP_VP = { width: 1280, height: 900 };

async function seedAuthAndData(page) {
  // Set auth tokens so app thinks we're logged in
  await page.evaluate(() => {
    localStorage.setItem('mind-palace-tokens', JSON.stringify({
      accessToken: 'eval-token-12345',
      refreshToken: 'eval-refresh-12345'
    }));
    localStorage.setItem('mind-palace-user', JSON.stringify({
      id: 1,
      username: 'evaluator',
      displayName: 'Palace Evaluator',
      role: 'admin'
    }));
  });

  // Reload to trigger Dexie initialization (app will see auth tokens and show main UI)
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Now seed data through the Dexie-created IndexedDB
  await page.evaluate(async () => {
    const now = new Date().toISOString();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Access the Dexie-created IndexedDB (correct name: MindPalaceDB)
    const DB_NAME = 'MindPalaceDB';

    function openDB() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
    }

    function putRecord(db, storeName, record) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    const db = await openDB();

    // === ROOMS ===
    const rooms = [
      { id: 1, moduleType: 'garage', name: '2021 Toyota Tacoma', description: 'Daily driver', metadata: { make: 'Toyota', model: 'Tacoma', year: 2021, vin: '5TFCZ5AN1MX123456', color: 'Cement', currentMileage: 47250, unitSystem: 'miles' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 2, moduleType: 'garage', name: '2019 Honda Civic', description: 'Commuter', metadata: { make: 'Honda', model: 'Civic', year: 2019, color: 'Crystal Black', currentMileage: 62100, unitSystem: 'miles' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 3, moduleType: 'kitchen', name: 'Main Kitchen', description: 'Primary kitchen', metadata: { areaType: 'full-kitchen' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 4, moduleType: 'kitchen', name: 'Outdoor Grill', description: 'Weber Genesis II', metadata: { areaType: 'outdoor-grill', applianceBrand: 'Weber', applianceModel: 'Genesis II E-310' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 5, moduleType: 'yard', name: 'Front Lawn', description: 'Main front yard', metadata: { zoneType: 'lawn', squareFootage: 1200, sunExposure: 'full-sun', soilType: 'loam' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 6, moduleType: 'yard', name: 'Vegetable Garden', description: 'Raised bed garden', metadata: { zoneType: 'garden-bed', squareFootage: 64, sunExposure: 'full-sun', soilType: 'loam' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 7, moduleType: 'bathroom', name: 'Master Bath', description: 'Primary bathroom', metadata: { location: 'Master Bedroom', hasShower: 'yes', hasTub: 'yes', fixtureAge: '2020' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 8, moduleType: 'home', name: 'HVAC System', description: 'Central air - Carrier', metadata: { systemType: 'hvac', brand: 'Carrier', model: 'Infinity 24ANB1', installDate: '2020-06-15', warrantyExpires: '2030-06-15', serviceProvider: "Mike's HVAC", servicePhone: '555-0123' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
      { id: 9, moduleType: 'home', name: 'Water Heater', description: 'Rheem 50 gal', metadata: { systemType: 'plumbing', brand: 'Rheem', model: 'Performance Plus', installDate: '2021-03-10' }, isArchived: false, createdAt: oneMonthAgo, updatedAt: now },
    ];

    for (const room of rooms) {
      await putRecord(db, 'rooms', room);
    }

    // === SCHEDULES ===
    const schedules = [
      // Garage - Tacoma
      { id: 1, roomId: 1, name: 'Oil Change', description: 'Full synthetic 0W-20', triggerType: 'mileage', intervalValue: 5000, intervalUnit: 'miles', lastCompletedValue: 44500, lastCompletedDate: oneMonthAgo, nextDueValue: 49500, nextDueDate: null, priority: 'high', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      { id: 2, roomId: 1, name: 'Tire Rotation', description: 'Rotate all 4 tires', triggerType: 'mileage', intervalValue: 7500, intervalUnit: 'miles', lastCompletedValue: 42000, lastCompletedDate: oneMonthAgo, nextDueValue: 49500, nextDueDate: null, priority: 'medium', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      { id: 3, roomId: 1, name: 'Air Filter', triggerType: 'mileage', intervalValue: 15000, intervalUnit: 'miles', lastCompletedValue: 35000, lastCompletedDate: oneMonthAgo, nextDueValue: 50000, nextDueDate: null, priority: 'low', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      // Garage - Civic (overdue!)
      { id: 4, roomId: 2, name: 'Oil Change', description: 'Conventional 5W-30', triggerType: 'mileage', intervalValue: 5000, intervalUnit: 'miles', lastCompletedValue: 57000, lastCompletedDate: oneMonthAgo, nextDueValue: 62000, nextDueDate: null, priority: 'high', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      // Kitchen
      { id: 5, roomId: 3, name: 'Deep Clean Oven', triggerType: 'time', intervalValue: 3, intervalUnit: 'months', lastCompletedDate: oneMonthAgo, nextDueDate: twoWeeksFromNow, priority: 'medium', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      { id: 6, roomId: 3, name: 'Replace Water Filter', triggerType: 'time', intervalValue: 6, intervalUnit: 'months', lastCompletedDate: oneMonthAgo, nextDueDate: threeDaysFromNow, priority: 'high', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      // Yard
      { id: 7, roomId: 5, name: 'Mow Lawn', triggerType: 'time', intervalValue: 1, intervalUnit: 'weeks', lastCompletedDate: oneWeekAgo, nextDueDate: now, priority: 'medium', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      { id: 8, roomId: 6, name: 'Water Garden', triggerType: 'time', intervalValue: 2, intervalUnit: 'days', lastCompletedDate: yesterday, nextDueDate: threeDaysFromNow, priority: 'high', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      // Bathroom
      { id: 9, roomId: 7, name: 'Deep Clean', triggerType: 'time', intervalValue: 1, intervalUnit: 'weeks', lastCompletedDate: oneWeekAgo, nextDueDate: yesterday, priority: 'high', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      // Home Systems
      { id: 10, roomId: 8, name: 'Replace HVAC Filter', triggerType: 'time', intervalValue: 3, intervalUnit: 'months', lastCompletedDate: oneMonthAgo, nextDueDate: oneWeekFromNow, priority: 'high', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
      { id: 11, roomId: 9, name: 'Flush Water Heater', triggerType: 'time', intervalValue: 1, intervalUnit: 'years', lastCompletedDate: oneMonthAgo, nextDueDate: twoWeeksFromNow, priority: 'medium', isActive: true, createdAt: oneMonthAgo, updatedAt: now },
    ];

    for (const schedule of schedules) {
      await putRecord(db, 'schedules', schedule);
    }

    // === PROCEDURES (including kitchen recipes) ===
    const procedures = [
      // Garage procedure
      { id: 1, roomId: 1, title: 'Oil Change - 3.5L V6', description: 'Full synthetic oil change procedure for 2021 Tacoma', estimatedTime: '45 minutes', difficulty: 'beginner', tags: ['maintenance', 'engine'], createdAt: oneMonthAgo, updatedAt: now },
      // Kitchen recipes
      { id: 2, roomId: 3, title: 'Cast Iron Skillet Steak', description: 'Perfect medium-rare ribeye with garlic butter baste', estimatedTime: '25 minutes', difficulty: 'intermediate', tags: ['dinner', 'beef', 'gluten-free', 'keto'], createdAt: oneMonthAgo, updatedAt: now },
      { id: 3, roomId: 3, title: 'Sourdough Bread', description: 'Classic artisan sourdough with overnight cold ferment', estimatedTime: '24 hours', difficulty: 'advanced', tags: ['baking', 'bread', 'vegetarian'], createdAt: oneMonthAgo, updatedAt: now },
      { id: 4, roomId: 3, title: 'Homemade Pasta', description: 'Fresh egg pasta from scratch - fettuccine or tagliatelle', estimatedTime: '1 hour', difficulty: 'intermediate', tags: ['dinner', 'pasta', 'vegetarian', 'italian'], createdAt: oneMonthAgo, updatedAt: now },
      // Yard procedure
      { id: 5, roomId: 5, title: 'Spring Lawn Revival', description: 'Complete spring lawn care: dethatch, aerate, overseed, fertilize', estimatedTime: '4 hours', difficulty: 'intermediate', tags: ['spring', 'lawn'], createdAt: oneMonthAgo, updatedAt: now },
    ];

    for (const proc of procedures) {
      await putRecord(db, 'procedures', proc);
    }

    // === PROCEDURE STEPS ===
    const steps = [
      // Oil change steps
      { id: 1, procedureId: 1, orderIndex: 0, instruction: 'Warm up engine for 5 minutes to thin the oil', specs: {}, tip: 'Warm oil drains faster and more completely', photoIds: [], createdAt: now, updatedAt: now },
      { id: 2, procedureId: 1, orderIndex: 1, instruction: 'Place drain pan under oil drain plug. Remove drain plug with 14mm socket.', specs: { torque: '33 ft-lbs' }, warning: 'Oil will be HOT. Wear gloves.', photoIds: [], createdAt: now, updatedAt: now },
      { id: 3, procedureId: 1, orderIndex: 2, instruction: 'Replace oil filter with new Mobil 1 M1-108A. Hand-tighten plus 3/4 turn.', specs: {}, tip: 'Apply thin coat of new oil to gasket', photoIds: [], createdAt: now, updatedAt: now },
      { id: 4, procedureId: 1, orderIndex: 3, instruction: 'Replace drain plug with new crush washer. Torque to spec.', specs: { torque: '33 ft-lbs' }, photoIds: [], createdAt: now, updatedAt: now },
      { id: 5, procedureId: 1, orderIndex: 4, instruction: 'Add 6.2 quarts of 0W-20 full synthetic oil. Check level with dipstick.', specs: {}, photoIds: [], createdAt: now, updatedAt: now },
      // Steak recipe steps
      { id: 6, procedureId: 2, orderIndex: 0, instruction: 'Remove steak from fridge 45 minutes before cooking. Pat dry and season generously with salt and pepper on all sides.', specs: { temperature: 'Room temp' }, tip: 'Use coarse kosher salt for best crust', photoIds: [], createdAt: now, updatedAt: now },
      { id: 7, procedureId: 2, orderIndex: 1, instruction: 'Heat cast iron skillet over high heat until smoking. Add 1 tbsp avocado oil.', specs: { temperature: '500°F' }, warning: 'Pan will be extremely hot. Use oven mitts.', photoIds: [], createdAt: now, updatedAt: now },
      { id: 8, procedureId: 2, orderIndex: 2, instruction: 'Sear steak for 3-4 minutes without moving. Flip once.', specs: { cookTime: '3-4 min per side' }, tip: 'Don\'t touch it! Let the Maillard reaction do its work.', photoIds: [], createdAt: now, updatedAt: now },
      { id: 9, procedureId: 2, orderIndex: 3, instruction: 'Add butter, garlic cloves, and thyme. Baste steak with melted butter for 1-2 minutes.', specs: { temperature: 'Medium-high', cookTime: '1-2 min' }, photoIds: [], createdAt: now, updatedAt: now },
      { id: 10, procedureId: 2, orderIndex: 4, instruction: 'Remove when internal temp hits 130°F for medium-rare. Rest 5 minutes before slicing.', specs: { temperature: '130°F internal' }, tip: 'Temp will rise 5°F during rest', photoIds: [], createdAt: now, updatedAt: now },
      // Sourdough steps
      { id: 11, procedureId: 3, orderIndex: 0, instruction: 'Mix 400g bread flour, 100g whole wheat flour, 375g water (78°F). Autolyse 30 minutes.', specs: { temperature: '78°F water' }, photoIds: [], createdAt: now, updatedAt: now },
      { id: 12, procedureId: 3, orderIndex: 1, instruction: 'Add 100g active levain and 10g salt. Squeeze and fold to incorporate.', specs: {}, tip: 'Levain should pass the float test', photoIds: [], createdAt: now, updatedAt: now },
      { id: 13, procedureId: 3, orderIndex: 2, instruction: 'Bulk ferment 4-5 hours. Perform stretch and folds every 30 minutes for first 2 hours.', specs: { temperature: '78°F ambient', cookTime: '4-5 hours' }, photoIds: [], createdAt: now, updatedAt: now },
      { id: 14, procedureId: 3, orderIndex: 3, instruction: 'Shape into boule and place in floured banneton. Cold retard in fridge 12-16 hours.', specs: { temperature: '38°F fridge', cookTime: '12-16 hours' }, photoIds: [], createdAt: now, updatedAt: now },
      { id: 15, procedureId: 3, orderIndex: 4, instruction: 'Preheat Dutch oven at 500°F for 1 hour. Score dough, bake covered 20 min, then uncovered 20-25 min at 450°F.', specs: { temperature: '500°F then 450°F', cookTime: '40-45 min' }, warning: 'Dutch oven will be extremely hot', photoIds: [], createdAt: now, updatedAt: now },
    ];

    for (const step of steps) {
      await putRecord(db, 'procedureSteps', step);
    }

    // === SUPPLIES (ingredients for recipes, parts for garage) ===
    const supplies = [
      // Oil change supplies
      { id: 1, procedureId: 1, category: 'part', name: 'Mobil 1 0W-20 (6 qt)', identifier: 'M1-0W20-6', manufacturer: 'Mobil 1', price: 32.99, quantity: 1, unit: 'jug', isRequired: true },
      { id: 2, procedureId: 1, category: 'part', name: 'Oil Filter M1-108A', identifier: 'M1-108A', manufacturer: 'Mobil 1', price: 12.99, quantity: 1, unit: 'each', isRequired: true },
      { id: 3, procedureId: 1, category: 'tool', name: '14mm Socket', quantity: 1, isRequired: true },
      { id: 4, procedureId: 1, category: 'tool', name: 'Oil Filter Wrench', quantity: 1, isRequired: true },
      { id: 5, procedureId: 1, category: 'consumable', name: 'Crush Washer', price: 1.50, quantity: 1, unit: 'each', isRequired: true },
      // Steak ingredients
      { id: 6, procedureId: 2, category: 'ingredient', name: 'Ribeye Steak', quantity: 2, unit: 'pieces', notes: '1.5 inch thick, bone-in preferred', isRequired: true },
      { id: 7, procedureId: 2, category: 'ingredient', name: 'Kosher Salt', quantity: 2, unit: 'tsp', isRequired: true },
      { id: 8, procedureId: 2, category: 'ingredient', name: 'Black Pepper', quantity: 1, unit: 'tsp', isRequired: true },
      { id: 9, procedureId: 2, category: 'ingredient', name: 'Unsalted Butter', quantity: 3, unit: 'tbsp', isRequired: true },
      { id: 10, procedureId: 2, category: 'ingredient', name: 'Garlic Cloves', quantity: 4, unit: 'cloves', notes: 'Smashed', isRequired: true },
      { id: 11, procedureId: 2, category: 'ingredient', name: 'Fresh Thyme', quantity: 3, unit: 'sprigs', isRequired: false },
      { id: 12, procedureId: 2, category: 'ingredient', name: 'Avocado Oil', quantity: 1, unit: 'tbsp', notes: 'High smoke point oil', isRequired: true },
      { id: 13, procedureId: 2, category: 'tool', name: 'Cast Iron Skillet (12")', quantity: 1, isRequired: true },
      // Sourdough ingredients
      { id: 14, procedureId: 3, category: 'ingredient', name: 'Bread Flour', quantity: 400, unit: 'g', isRequired: true },
      { id: 15, procedureId: 3, category: 'ingredient', name: 'Whole Wheat Flour', quantity: 100, unit: 'g', isRequired: true },
      { id: 16, procedureId: 3, category: 'ingredient', name: 'Water', quantity: 375, unit: 'g', notes: '78°F', isRequired: true },
      { id: 17, procedureId: 3, category: 'ingredient', name: 'Active Sourdough Levain', quantity: 100, unit: 'g', isRequired: true },
      { id: 18, procedureId: 3, category: 'ingredient', name: 'Fine Sea Salt', quantity: 10, unit: 'g', isRequired: true },
      { id: 19, procedureId: 3, category: 'tool', name: 'Dutch Oven', quantity: 1, isRequired: true },
      { id: 20, procedureId: 3, category: 'tool', name: 'Banneton Basket', quantity: 1, isRequired: true },
    ];

    for (const supply of supplies) {
      await putRecord(db, 'supplies', supply);
    }

    // === TASK LOGS ===
    const taskLogs = [
      { id: 1, roomId: 1, scheduleId: 1, title: 'Oil Change @ 44,500 mi', date: oneMonthAgo, trackingValue: 44500, cost: 48.48, laborHours: 0.75, performedBy: 'Moses', notes: 'Used Mobil 1 0W-20. Filter was very dirty.', photoIds: [], createdAt: oneMonthAgo, updatedAt: oneMonthAgo },
      { id: 2, roomId: 1, scheduleId: 2, title: 'Tire Rotation @ 42,000 mi', date: oneMonthAgo, trackingValue: 42000, cost: 0, laborHours: 0.5, performedBy: 'Moses', photoIds: [], createdAt: oneMonthAgo, updatedAt: oneMonthAgo },
      { id: 3, roomId: 7, scheduleId: 9, title: 'Deep Clean - Master Bath', date: oneWeekAgo, cost: 15, laborHours: 1.5, performedBy: 'Moses', notes: 'Scrubbed tile grout, cleaned fixtures', photoIds: [], createdAt: oneWeekAgo, updatedAt: oneWeekAgo },
    ];

    for (const log of taskLogs) {
      await putRecord(db, 'taskLogs', log);
    }

    // === REFERENCES ===
    const references = [
      { id: 1, roomId: 1, procedureId: 1, title: 'Tacoma Oil Change - YouTube', url: 'https://www.youtube.com/watch?v=example1', type: 'youtube', notes: 'Great step-by-step video', createdAt: oneMonthAgo },
      { id: 2, roomId: 1, title: 'Tacoma Owners Manual', url: 'https://www.toyota.com/owners/resources/warranty-owners-manuals', type: 'manual', createdAt: oneMonthAgo },
      { id: 3, roomId: 3, procedureId: 2, title: 'Kenji\'s Reverse Sear Method', url: 'https://www.seriouseats.com/reverse-seared-steak-recipe', type: 'article', notes: 'Alternative method for thicker steaks', createdAt: oneMonthAgo },
      { id: 4, roomId: 3, procedureId: 3, title: 'Full Proof Baking - Sourdough', url: 'https://www.youtube.com/watch?v=example2', type: 'youtube', notes: 'Best visual guide for shaping', createdAt: oneMonthAgo },
      { id: 5, roomId: 8, title: 'Carrier HVAC Filter Guide', url: 'https://www.carrier.com/residential/en/us/products/air-cleaners/', type: 'manual', createdAt: oneMonthAgo },
    ];

    for (const ref of references) {
      await putRecord(db, 'references', ref);
    }

    // === NOTES ===
    const notes = [
      { id: 1, roomId: 1, title: 'Tacoma Service Notes', content: 'Dealer wants $120 for oil change. DIY cost is ~$48. Always check the skid plate bolts after.', isPinned: true, createdAt: oneMonthAgo, updatedAt: now },
      { id: 2, roomId: 3, title: 'Sourdough Starter Schedule', content: 'Feed starter 1:5:5 ratio every 12 hours at room temp. Refrigerate if not baking for >3 days. Name: Clint Yeastwood.', isPinned: true, createdAt: oneMonthAgo, updatedAt: now },
      { id: 3, roomId: 8, title: 'HVAC Service Contract', content: 'Annual service with Mike\'s HVAC - $189/year. Covers spring tune-up and fall inspection. Contract renews in June.', isPinned: false, createdAt: oneMonthAgo, updatedAt: now },
    ];

    for (const note of notes) {
      await putRecord(db, 'notes', note);
    }

    // === APP SETTINGS ===
    await putRecord(db, 'appSettings', {
      id: 1,
      defaultUnitSystem: 'miles',
      notificationsEnabled: true,
      reminderLeadDays: 7,
      reminderLeadMiles: 500,
      theme: 'dark',
      exportVersion: 1,
    });

    console.log('Seed data complete!');
  });

  // Reload to pick up seeded data
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
}

async function screenshotPage(page, name, path, viewport = null) {
  if (viewport) {
    await page.setViewportSize(viewport);
  }
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Scroll to bottom and back to trigger any lazy content
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const filename = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot: ${name} -> ${filename}`);
  return filename;
}

async function main() {
  console.log(`Starting evaluation at ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: MOBILE_VP,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    // Navigate to app and seed data
    console.log('Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    console.log('Seeding auth and sample data...');
    await seedAuthAndData(page);

    // === MOBILE SCREENSHOTS ===
    console.log('\n--- Mobile Screenshots (390x844) ---');

    await screenshotPage(page, '01-dashboard-mobile', '/');
    await screenshotPage(page, '02-room-tacoma-mobile', '/room/1');
    await screenshotPage(page, '03-room-kitchen-mobile', '/room/3');
    await screenshotPage(page, '04-schedules-tacoma-mobile', '/room/1/schedules');
    await screenshotPage(page, '05-procedures-garage-mobile', '/room/1/procedures');
    await screenshotPage(page, '06-recipes-kitchen-mobile', '/room/3/procedures');
    await screenshotPage(page, '07-recipe-detail-steak-mobile', '/room/3/procedure/2');
    await screenshotPage(page, '08-recipe-detail-sourdough-mobile', '/room/3/procedure/3');
    await screenshotPage(page, '09-room-yard-mobile', '/room/5');
    await screenshotPage(page, '10-room-bathroom-mobile', '/room/7');
    await screenshotPage(page, '11-room-hvac-mobile', '/room/8');
    await screenshotPage(page, '12-calendar-mobile', '/calendar');
    await screenshotPage(page, '13-dreamcatcher-mobile', '/dreamcatcher');
    await screenshotPage(page, '14-task-log-mobile', '/room/1/log');
    await screenshotPage(page, '15-references-mobile', '/room/1/references');
    await screenshotPage(page, '16-notes-mobile', '/room/1/notes');
    await screenshotPage(page, '17-settings-mobile', '/settings');
    await screenshotPage(page, '18-new-room-form-mobile', '/room/new');
    await screenshotPage(page, '19-new-schedule-form-mobile', '/room/1/schedule/new');

    // Test search overlay
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    // Look for search button and click it
    const searchBtn = await page.$('[aria-label="Search"]');
    if (searchBtn) {
      await searchBtn.click();
      await page.waitForTimeout(500);
      await page.keyboard.type('oil');
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/20-search-overlay-mobile.png`, fullPage: true });
      console.log('Screenshot: 20-search-overlay-mobile');
      await page.keyboard.press('Escape');
    } else {
      console.log('Search button not found - skipping search screenshot');
    }

    // === DESKTOP SCREENSHOTS ===
    console.log('\n--- Desktop Screenshots (1280x900) ---');

    await screenshotPage(page, '21-dashboard-desktop', '/', DESKTOP_VP);
    await screenshotPage(page, '22-room-tacoma-desktop', '/room/1', DESKTOP_VP);
    await screenshotPage(page, '23-recipes-kitchen-desktop', '/room/3/procedures', DESKTOP_VP);
    await screenshotPage(page, '24-recipe-detail-desktop', '/room/3/procedure/2', DESKTOP_VP);
    await screenshotPage(page, '25-calendar-desktop', '/calendar', DESKTOP_VP);

    console.log('\n--- All screenshots complete ---');
    console.log(`Total screenshots in ${SCREENSHOTS_DIR}/`);

  } catch (err) {
    console.error('Error during evaluation:', err);
    // Take error screenshot
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/ERROR.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
