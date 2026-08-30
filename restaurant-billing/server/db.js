const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// On Railway, use the mounted volume path for persistence; fallback to local
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'restaurant.db')
  : path.join(__dirname, 'restaurant.db');

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL,
    category TEXT DEFAULT 'Main Course',
    image_url TEXT DEFAULT '',
    available INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE NOT NULL,
    label TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_order REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
`);

// Seed default admin
const passwordHash = bcrypt.hashSync('admin123', 10);
db.prepare(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`)
  .run('admin', passwordHash);

// Seed tables
const insertTable = db.prepare(`INSERT OR IGNORE INTO tables (table_number, label) VALUES (?, ?)`);
for (let i = 1; i <= 5; i++) {
  insertTable.run(String(i), `Table ${i}`);
}

// Seed menu items only if table is empty
const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
if (menuCount.count === 0) {
  const insertItem = db.prepare(`
    INSERT INTO menu_items (name, description, price, category, available)
    VALUES (?, ?, ?, ?, 1)
  `);
  const menuItems = [
    ['Veg Spring Rolls', 'Crispy golden rolls filled with fresh vegetables', 120, 'Starters'],
    ['Paneer Tikka', 'Marinated paneer grilled to perfection', 180, 'Starters'],
    ['Butter Chicken', 'Creamy tomato-based curry with tender chicken', 280, 'Main Course'],
    ['Dal Makhani', 'Slow-cooked black lentils in rich buttery gravy', 220, 'Main Course'],
    ['Garlic Naan', 'Soft flatbread topped with garlic and butter', 40, 'Main Course'],
    ['Mango Lassi', 'Chilled yogurt drink blended with fresh mango', 80, 'Beverages'],
    ['Cold Coffee', 'Rich chilled coffee with cream', 90, 'Beverages'],
    ['Gulab Jamun', 'Soft milk dumplings soaked in rose syrup', 60, 'Desserts'],
  ];
  for (const item of menuItems) {
    insertItem.run(...item);
  }
}

module.exports = db;
