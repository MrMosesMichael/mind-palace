import db from './index';

export function initializeDatabase(): void {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Refresh tokens
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    -- Palaces
    CREATE TABLE IF NOT EXISTS palaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      imageId TEXT,
      imageUrl TEXT,
      isDefault INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Room Hotspots
    CREATE TABLE IF NOT EXISTS room_hotspots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      palaceId INTEGER NOT NULL REFERENCES palaces(id) ON DELETE CASCADE,
      roomId INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      label TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Rooms
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      palaceId INTEGER,
      moduleType TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      photoId TEXT,
      metadata TEXT DEFAULT '{}',
      isArchived INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Schedules
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      triggerType TEXT NOT NULL,
      intervalValue INTEGER,
      intervalUnit TEXT,
      lastCompletedValue REAL,
      lastCompletedDate TEXT,
      nextDueValue REAL,
      nextDueDate TEXT,
      procedureId INTEGER,
      priority TEXT DEFAULT 'medium',
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Task Logs
    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      scheduleId INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      trackingValue REAL,
      cost REAL,
      laborHours REAL,
      performedBy TEXT,
      procedureId INTEGER,
      notes TEXT,
      photoIds TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Procedures
    CREATE TABLE IF NOT EXISTS procedures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      estimatedTime TEXT,
      difficulty TEXT,
      tags TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Procedure Steps
    CREATE TABLE IF NOT EXISTS procedure_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      procedureId INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
      orderIndex INTEGER NOT NULL,
      instruction TEXT NOT NULL,
      specs TEXT DEFAULT '{}',
      warning TEXT,
      tip TEXT,
      photoIds TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Supplies
    CREATE TABLE IF NOT EXISTS supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      procedureId INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      identifier TEXT,
      manufacturer TEXT,
      supplier TEXT,
      supplierUrl TEXT,
      price REAL,
      quantity REAL,
      unit TEXT,
      notes TEXT,
      isRequired INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Inventory
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT,
      quantity REAL,
      unit TEXT,
      minQuantity REAL,
      location TEXT,
      identifier TEXT,
      supplierUrl TEXT,
      notes TEXT,
      lastChecked TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- References
    CREATE TABLE IF NOT EXISTS refs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      procedureId INTEGER REFERENCES procedures(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      url TEXT,
      type TEXT DEFAULT 'link',
      notes TEXT,
      thumbnailUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Photos (metadata only, files on disk)
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      procedureId INTEGER REFERENCES procedures(id) ON DELETE SET NULL,
      logEntryId INTEGER REFERENCES task_logs(id) ON DELETE SET NULL,
      stepId INTEGER REFERENCES procedure_steps(id) ON DELETE SET NULL,
      noteId INTEGER REFERENCES notes(id) ON DELETE SET NULL,
      caption TEXT,
      mimeType TEXT NOT NULL,
      sizeBytes INTEGER NOT NULL,
      takenAt TEXT,
      createdAt TEXT NOT NULL
    );

    -- Notes
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      logEntryId INTEGER REFERENCES task_logs(id) ON DELETE SET NULL,
      title TEXT,
      content TEXT NOT NULL,
      isPinned INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Vehicles (for garage rooms)
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      make TEXT,
      model TEXT,
      year INTEGER,
      vin TEXT,
      licensePlate TEXT,
      color TEXT,
      currentMileage REAL,
      unitSystem TEXT DEFAULT 'miles',
      photoId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Reminders
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roomId INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
      scheduleId INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      dueValue REAL,
      dueDate TEXT,
      isAcknowledged INTEGER DEFAULT 0,
      notificationSent INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    -- App Settings (per user)
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT DEFAULT 'dark',
      defaultUnitSystem TEXT DEFAULT 'miles',
      reminderLeadDays INTEGER DEFAULT 7,
      reminderLeadMiles INTEGER DEFAULT 500,
      notificationsEnabled INTEGER DEFAULT 1,
      lastExportDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- API Keys
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      keyHash TEXT NOT NULL,
      keyPrefix TEXT NOT NULL,
      scopes TEXT DEFAULT '["read","write"]',
      lastUsedAt TEXT,
      expiresAt TEXT,
      createdAt TEXT NOT NULL
    );

    -- Indexes for columns that exist in CREATE TABLE
    CREATE INDEX IF NOT EXISTS idx_palaces_userId ON palaces(userId);
    CREATE INDEX IF NOT EXISTS idx_room_hotspots_palaceId ON room_hotspots(palaceId);
    CREATE INDEX IF NOT EXISTS idx_room_hotspots_userId ON room_hotspots(userId);
    CREATE INDEX IF NOT EXISTS idx_rooms_userId ON rooms(userId);
    CREATE INDEX IF NOT EXISTS idx_schedules_roomId ON schedules(roomId);
    CREATE INDEX IF NOT EXISTS idx_schedules_userId ON schedules(userId);
    CREATE INDEX IF NOT EXISTS idx_task_logs_roomId ON task_logs(roomId);
    CREATE INDEX IF NOT EXISTS idx_procedures_roomId ON procedures(roomId);
    CREATE INDEX IF NOT EXISTS idx_procedure_steps_procedureId ON procedure_steps(procedureId);
    CREATE INDEX IF NOT EXISTS idx_supplies_procedureId ON supplies(procedureId);
    CREATE INDEX IF NOT EXISTS idx_photos_roomId ON photos(roomId);
    CREATE INDEX IF NOT EXISTS idx_notes_roomId ON notes(roomId);
    CREATE INDEX IF NOT EXISTS idx_refs_roomId ON refs(roomId);
    CREATE INDEX IF NOT EXISTS idx_inventory_roomId ON inventory(roomId);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_userId ON refresh_tokens(userId);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_vehicles_roomId ON vehicles(roomId);
    CREATE INDEX IF NOT EXISTS idx_vehicles_userId ON vehicles(userId);
    CREATE INDEX IF NOT EXISTS idx_api_keys_keyHash ON api_keys(keyHash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_userId ON api_keys(userId);
  `);

  // --- ALTER TABLE migrations for existing databases ---
  // These must run BEFORE indexes that reference the new columns

  try {
    db.exec(`ALTER TABLE rooms ADD COLUMN palaceId INTEGER REFERENCES palaces(id)`);
  } catch { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE palaces ADD COLUMN imageUrl TEXT`);
  } catch { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE supplies ADD COLUMN photoId TEXT`);
  } catch { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE notes ADD COLUMN photoIds TEXT DEFAULT '[]'`);
  } catch { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE photos ADD COLUMN noteId INTEGER`);
  } catch { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE schedules ADD COLUMN vehicleId INTEGER`);
  } catch { /* Column already exists */ }

  try {
    db.exec(`ALTER TABLE task_logs ADD COLUMN vehicleId INTEGER`);
  } catch { /* Column already exists */ }

  // --- Indexes that depend on ALTER TABLE columns ---
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rooms_palaceId ON rooms(palaceId);
    CREATE INDEX IF NOT EXISTS idx_photos_noteId ON photos(noteId);
  `);
}
