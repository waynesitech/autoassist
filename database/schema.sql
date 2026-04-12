-- AutoAssist Database Schema
-- Run this script to create the database and tables manually if needed

CREATE DATABASE IF NOT EXISTS autoassist;
USE autoassist;

-- Workshops table
CREATE TABLE IF NOT EXISTS workshops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rating DECIMAL(3,1) NOT NULL,
  location VARCHAR(255) NOT NULL,
  icon VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (before transactions: transactions.user_id FK)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('Quotation', 'Towing', 'Shop') NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'ongoing', 'cancelled') NOT NULL DEFAULT 'pending',
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image VARCHAR(500) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  workshop_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL,
  INDEX idx_workshop_id (workshop_id)
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(50) NOT NULL,
  user_id INT,
  workshop_id INT NOT NULL,
  model VARCHAR(255) NOT NULL,
  year VARCHAR(10) NOT NULL,
  engine VARCHAR(255) NOT NULL,
  chassis VARCHAR(255) NOT NULL,
  description TEXT,
  quote_type ENUM('brief', 'detailed') NOT NULL DEFAULT 'brief',
  images TEXT,
  amount DECIMAL(10,2) NOT NULL,
  admin_message TEXT,
  status ENUM('pending', 'completed', 'ongoing', 'cancelled') NOT NULL DEFAULT 'pending',
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE RESTRICT,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_user_id (user_id),
  INDEX idx_workshop_id (workshop_id),
  INDEX idx_status (status),
  INDEX idx_date (date)
);

-- Banner Sliders table
CREATE TABLE IF NOT EXISTS banner_sliders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  image VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active)
);

-- Towing Requests table
CREATE TABLE IF NOT EXISTS towing_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(50) NOT NULL,
  user_id INT,
  workshop_id INT NOT NULL,
  pickup VARCHAR(500) NOT NULL,
  destination VARCHAR(500) NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  destination_latitude DECIMAL(10, 8),
  destination_longitude DECIMAL(11, 8),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'ongoing', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE RESTRICT,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_user_id (user_id),
  INDEX idx_workshop_id (workshop_id),
  INDEX idx_status (status),
  INDEX idx_date (date)
);

-- Cart Items table (for active shopping cart)
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id)
);

-- Shop Orders table (for completed shop orders)
CREATE TABLE IF NOT EXISTS shop_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(50) NOT NULL,
  user_id INT,
  workshop_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'ongoing', 'cancelled') NOT NULL DEFAULT 'pending',
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE RESTRICT,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_user_id (user_id),
  INDEX idx_workshop_id (workshop_id),
  INDEX idx_status (status),
  INDEX idx_date (date)
);

-- Towing fixed route charges (origin → via police station → destination), amounts in MYR
CREATE TABLE IF NOT EXISTS towing_location_charges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin_location VARCHAR(255) NOT NULL,
  via_location VARCHAR(255) NOT NULL,
  destination_location VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'MYR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_route (origin_location, via_location, destination_location),
  INDEX idx_origin (origin_location),
  INDEX idx_destination (destination_location)
);

-- Shop Order Items table (for individual items in each order)
CREATE TABLE IF NOT EXISTS shop_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
);

INSERT INTO towing_location_charges (origin_location, via_location, destination_location, amount) VALUES
('KL', 'KL BALAI', 'Segambut', 250.00),
('Ampang', 'Ampang BALAI', 'Segambut', 250.00),
('CHERAS', 'KL BALAI', 'Segambut', 250.00),
('ULU KELANG', 'AMPANG BALAI', 'Segambut', 250.00),
('DESA PETALING', 'SRI PETALING BALAI', 'Segambut', 280.00),
('SG BESI', 'SRI PETALING BALAI', 'Segambut', 280.00),
('BUKIT JALIL', 'SRI PETALING BALAI', 'Segambut', 280.00),
('SERDANG', 'KINRARA BALAI', 'Segambut', 300.00),
('Seri kembangan', 'KINRARA BALAI', 'Segambut', 350.00),
('balakong', 'kajang BALAI', 'Segambut', 300.00),
('semenyih', 'kajang BALAI', 'Segambut', 350.00),
('Bangi', 'kajang BALAI', 'Segambut', 330.00),
('cheras Batu 9', 'kajang BALAI', 'Segambut', 300.00),
('Puchong', 'KINRARA BALAI', 'Segambut', 280.00),
('Subang', 'USJ BALAI', 'Segambut', 280.00),
('PJ', 'PJ BALAI', 'Segambut', 250.00),
('Sg Buloh', 'Sg Buloh BALAI', 'Segambut', 250.00),
('SRI DAMANSARA', 'KOTA DAMANSARA BALAI', 'Segambut', 250.00),
('RAWANG', 'selayang BALAI', 'Segambut', 280.00),
('Shah Alam', 'Shah Alam BALAI', 'Segambut', 280.00),
('Klang', 'Klang BALAI', 'Segambut', 350.00),
('KEPONG', 'KEPONG BALAI', 'Segambut', 220.00),
('Batu caves', 'selayang BALAI', 'Segambut', 220.00),
('PUTRAJAYA', 'SALAK TINGGI BALAI', 'Segambut', 450.00),
('KLIA', 'sepang BALAI', 'Segambut', 500.00),
('Nilai', 'Nilai BALAI', 'Segambut', 480.00),
('Seremban', 'Seremban BALAI', 'Segambut', 500.00)
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- Insert initial workshops data
INSERT INTO workshops (name, rating, location, icon) VALUES
('Syarikat Bengkel Soan Huat Sdn. Bhd.', 4.8, 'No.26, Persiaran Segambut Tengah, Segambut 51200 KL.', 'fa-wrench')
ON DUPLICATE KEY UPDATE name=name;

-- Insert initial products data
INSERT INTO products (name, price, category, image, stock) VALUES
('Synthetic Engine Oil 5W-40', 185.00, 'Lubricants', 'https://picsum.photos/id/10/400/400', 12),
('High Performance Brake Pads', 220.00, 'Brakes', 'https://picsum.photos/id/11/400/400', 5),
('Premium Oil Filter', 35.00, 'Filters', 'https://picsum.photos/id/12/400/400', 40),
('LED Headlight Bulbs (Pair)', 150.00, 'Electrical', 'https://picsum.photos/id/13/400/400', 8),
('Car Battery (Maintenance Free)', 280.00, 'Electrical', 'https://picsum.photos/id/14/400/400', 15),
('Wiper Blade Set', 65.00, 'Accessories', 'https://picsum.photos/id/15/400/400', 25)
ON DUPLICATE KEY UPDATE name=name;

-- Insert initial transactions data
INSERT INTO transactions (id, type, title, date, amount, status) VALUES
('TX001', 'Towing', 'Towing to Bangsar', '2023-11-20', 150.00, 'completed'),
('TX002', 'Quotation', 'Detailed Valuation (Honda Civic)', '2023-11-19', 15.00, 'completed'),
('TX003', 'Shop', 'Engine Oil Filter', '2023-11-18', 45.00, 'ongoing'),
('TX004', 'Quotation', 'Brief Quotation (Toyota Vios)', '2023-11-17', 5.00, 'cancelled')
ON DUPLICATE KEY UPDATE id=id;

-- Insert initial banner sliders data
INSERT INTO banner_sliders (title, subtitle, image, display_order, is_active) VALUES
('Premium Towing Service', '24/7 Professional Car Recovery', 'https://picsum.photos/id/1071/800/400', 1, TRUE),
('Expert Vehicle Inspection', 'Get a detailed valuation report today', 'https://picsum.photos/id/1072/800/400', 2, TRUE),
('Genuine Auto Parts', 'Up to 20% off on monthly deals', 'https://picsum.photos/id/1070/800/400', 3, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Note: Initial user will be created by database.js with proper bcrypt hashing
-- Default user: ahmad.z@example.com / password: password123
