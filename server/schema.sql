-- ============================================================
--  Ayyappa Tours — Complete Database Schema
--  Run this in psql or any PostgreSQL client to recreate all tables
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ── Drop existing tables (clean slate) ──────────────────────
DROP TABLE IF EXISTS logs        CASCADE;
DROP TABLE IF EXISTS bookings    CASCADE;
DROP TABLE IF EXISTS trips       CASCADE;
DROP TABLE IF EXISTS cabs        CASCADE;
DROP TABLE IF EXISTS places      CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ============================================================
--  1. ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(100) NOT NULL UNIQUE,
  password     TEXT        NOT NULL,  -- bcrypt hash
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_users (username, password) VALUES (
  'admin',
  '$2b$12$KIp4P1NaANGmVBjBk3E8/.Xp5sR7U9VkXuWz1234567890abcdefgh'
  -- Replace the hash above by running:
  -- node -e "const b=require('bcrypt');b.hash('YourNewPassword',12).then(console.log)"
);

-- ============================================================
--  2. PLACES  (admin managed destinations)
-- ============================================================
CREATE TABLE places (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  tag         VARCHAR(100),
  image_url   TEXT,
  active      BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_places_active ON places(active);

-- ============================================================
--  3. TRIPS  (tour packages)
-- ============================================================
CREATE TABLE trips (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  location     VARCHAR(255),
  category     VARCHAR(100),   -- hillstation | wildlife | backwater | beach
  max_capacity INTEGER         DEFAULT 20,
  image_url    TEXT,
  duration     VARCHAR(100),   -- e.g. "3 Days"
  price        NUMERIC(10,2),  -- optional, for display
  available    BOOLEAN         DEFAULT true,
  created_at   TIMESTAMPTZ     DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX idx_trips_category  ON trips(category);
CREATE INDEX idx_trips_available ON trips(available);

-- Sample trips (remove if you want a clean slate)
INSERT INTO trips (title, description, location, category, max_capacity, image_url, duration, available) VALUES
  ('Munnar Hill Escape',       '3 days through mist-covered tea plantations and rolling highlands.',  'Munnar, Kerala',   'hillstation', 25, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80', '3 Days', true),
  ('Periyar Wildlife Safari',  'Cruise Periyar Lake and watch wild elephants emerge at dawn.',        'Thekkady, Kerala',  'wildlife',    20, 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', '2 Days', true),
  ('Alleppey Houseboat Drift', 'Drift through emerald backwaters on a traditional Kerala houseboat.','Alleppey, Kerala',  'backwater',   15, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80', '2 Days', true),
  ('Kovalam Beach Retreat',    'Luminous crescent beach with lighthouse views and sea-salt air.',    'Kovalam, Kerala',   'beach',       30, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', '2 Days', true);

-- ============================================================
--  4. CABS  (vehicle fleet)
-- ============================================================
CREATE TABLE cabs (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  category     VARCHAR(100),   -- sedan | suv | tempo | minibus
  max_capacity INTEGER         DEFAULT 4,
  image_url    TEXT,
  available    BOOLEAN         DEFAULT true,
  created_at   TIMESTAMPTZ     DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX idx_cabs_available ON cabs(available);

-- ============================================================
--  5. BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id               SERIAL PRIMARY KEY,
  reference        VARCHAR(20)  NOT NULL UNIQUE,  -- e.g. AYT-XXXXXX
  customer_name    VARCHAR(255) NOT NULL,
  customer_email   VARCHAR(255) NOT NULL,
  customer_phone   VARCHAR(30)  NOT NULL,
  place            VARCHAR(255),
  travel_date      DATE         NOT NULL,
  persons          INTEGER      NOT NULL DEFAULT 1,
  special_requests TEXT,
  status           VARCHAR(30)  NOT NULL DEFAULT 'pending',
  -- pending | confirmed | cancelled | completed
  wa_admin_sent    BOOLEAN      DEFAULT false,
  wa_customer_sent BOOLEAN      DEFAULT false,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW(),

  CONSTRAINT chk_persons  CHECK (persons >= 1 AND persons <= 200),
  CONSTRAINT chk_status   CHECK (status IN ('pending','confirmed','cancelled','completed'))
);

CREATE INDEX idx_bookings_status     ON bookings(status);
CREATE INDEX idx_bookings_reference  ON bookings(reference);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_bookings_email      ON bookings(customer_email);

-- ============================================================
--  6. LOGS  (admin activity log)
-- ============================================================
CREATE TABLE logs (
  id         SERIAL PRIMARY KEY,
  action     VARCHAR(255) NOT NULL,  -- e.g. "booking_confirmed"
  entity     VARCHAR(100),           -- e.g. "booking"
  entity_id  INTEGER,
  details    JSONB,                  -- any extra data as JSON
  ip         VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_action     ON logs(action);

-- ============================================================
--  Auto-update updated_at on row change
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cabs_updated_at
  BEFORE UPDATE ON cabs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
--  Done — verify with:
--  \dt                        (list all tables)
--  SELECT * FROM admin_users; (check admin exists)
--  SELECT * FROM trips;       (check sample trips)
-- ============================================================
