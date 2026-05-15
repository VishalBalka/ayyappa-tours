const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const run = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to Supabase successfully.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        category VARCHAR(50),
        price DECIMAL(10,2) NOT NULL,
        max_capacity INTEGER,
        image_url TEXT,
        duration VARCHAR(50),
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER REFERENCES trips(id),
        status VARCHAR(50) DEFAULT 'pending',
        total_price DECIMAL(10,2) NOT NULL,
        persons INTEGER NOT NULL,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES admins(id),
        ip_address VARCHAR(50),
        success BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tables created successfully.");

    const adminCheck = await pool.query("SELECT * FROM admins");
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO admins (username, password_hash) VALUES ($1, $2)",
        ["admin", hash]
      );
      console.log("Default admin created: username 'admin', password 'admin123'");
    } else {
      console.log("Admin already exists.");
    }

    const tripsCheck = await pool.query("SELECT * FROM trips");
    if (tripsCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO trips (title, description, location, category, price, max_capacity, image_url, duration, available) VALUES
        ('Munnar Hill Escape', '3 days through mist-covered tea plantations and rolling highlands.', 'Munnar, Kerala', 'hillstation', 8500, 25, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80', '3 Days', true),
        ('Periyar Wildlife Safari', 'Cruise Periyar Lake and watch wild elephants emerge at dawn.', 'Thekkady, Kerala', 'wildlife', 5500, 20, 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', '2 Days', true),
        ('Alleppey Houseboat Drift', 'Drift through emerald backwaters on a traditional Kerala houseboat.', 'Alleppey, Kerala', 'backwater', 7200, 15, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80', '2 Days', true)
      `);
      console.log("Sample trips inserted.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
};

run();