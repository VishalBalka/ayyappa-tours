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

INSERT INTO admins (username, password_hash) 
SELECT 'admin', '$2a$10$tZ2R2x6Yy8eKjK0Kz0JpX.oH8Z3F3yL4W7z1a9h1c7e2b1a8d9f1g' 
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');

INSERT INTO trips (title, description, location, category, price, max_capacity, image_url, duration, available) 
SELECT 'Munnar Hill Escape', '3 days through mist-covered tea plantations and rolling highlands.', 'Munnar, Kerala', 'hillstation', 8500, 25, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80', '3 Days', true
WHERE NOT EXISTS (SELECT 1 FROM trips);
