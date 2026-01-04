import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autoassist',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  try {
    // Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'autoassist'}`);
    await connection.end();

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workshops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rating DECIMAL(3,1) NOT NULL,
        location VARCHAR(255) NOT NULL,
        icon VARCHAR(100) NOT NULL,
        image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add image column if it doesn't exist (for existing databases)
    try {
      await pool.query('ALTER TABLE workshops ADD COLUMN image VARCHAR(500)');
    } catch (error: any) {
      // Column already exists, ignore error
      if (!error.message?.includes('Duplicate column name')) {
        console.warn('Could not add image column:', error.message);
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        type ENUM('Quotation', 'Towing', 'Shop') NOT NULL,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'completed', 'ongoing', 'cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image VARCHAR(500) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        model VARCHAR(255) NOT NULL,
        year VARCHAR(10) NOT NULL,
        chassis VARCHAR(255) NOT NULL,
        engine VARCHAR(255) NOT NULL,
        plate_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
        email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
        sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
        order_updates BOOLEAN NOT NULL DEFAULT TRUE,
        service_reminders BOOLEAN NOT NULL DEFAULT TRUE,
        promotions BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      )
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
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
      )
    `);

    // Clear all workshops and insert only the correct one
    await pool.query('DELETE FROM workshops');
    await pool.query(`
      INSERT INTO workshops (name, rating, location, icon) VALUES
      ('Syarikat Bengkel Soan Huat Sdn. Bhd.', 4.8, 'No.26, Persiaran Segambut Tengah, Segambut 51200 KL.', 'fa-wrench')
    `);

    const [productRows] = await pool.query('SELECT COUNT(*) as count FROM products') as any;
    if (productRows[0].count === 0) {
      await pool.query(`
        INSERT INTO products (name, price, category, image, stock) VALUES
        ('Synthetic Engine Oil 5W-40', 185.00, 'Lubricants', 'https://picsum.photos/id/10/400/400', 12),
        ('High Performance Brake Pads', 220.00, 'Brakes', 'https://picsum.photos/id/11/400/400', 5),
        ('Premium Oil Filter', 35.00, 'Filters', 'https://picsum.photos/id/12/400/400', 40),
        ('LED Headlight Bulbs (Pair)', 150.00, 'Electrical', 'https://picsum.photos/id/13/400/400', 8),
        ('Car Battery (Maintenance Free)', 280.00, 'Electrical', 'https://picsum.photos/id/14/400/400', 15),
        ('Wiper Blade Set', 65.00, 'Accessories', 'https://picsum.photos/id/15/400/400', 25)
      `);
    }

    const [transactionRows] = await pool.query('SELECT COUNT(*) as count FROM transactions') as any;
    if (transactionRows[0].count === 0) {
      await pool.query(`
        INSERT INTO transactions (id, type, title, date, amount, status) VALUES
        ('TX001', 'Towing', 'Towing to Bangsar', '2023-11-20', 150.00, 'completed'),
        ('TX002', 'Quotation', 'Detailed Valuation (Honda Civic)', '2023-11-19', 15.00, 'completed'),
        ('TX003', 'Shop', 'Engine Oil Filter', '2023-11-18', 45.00, 'ongoing'),
        ('TX004', 'Quotation', 'Brief Quotation (Toyota Vios)', '2023-11-17', 5.00, 'cancelled')
      `);
    }

    const [bannerRows] = await pool.query('SELECT COUNT(*) as count FROM banner_sliders') as any;
    if (bannerRows[0].count === 0) {
      await pool.query(`
        INSERT INTO banner_sliders (title, subtitle, image, display_order, is_active) VALUES
        ('Premium Towing Service', '24/7 Professional Car Recovery', 'https://picsum.photos/id/1071/800/400', 1, TRUE),
        ('Expert Vehicle Inspection', 'Get a detailed valuation report today', 'https://picsum.photos/id/1072/800/400', 2, TRUE),
        ('Genuine Auto Parts', 'Up to 20% off on monthly deals', 'https://picsum.photos/id/1070/800/400', 3, TRUE)
      `);
    }

    // Insert default user if users table is empty
    const [userRows] = await pool.query('SELECT COUNT(*) as count FROM users') as any;
    if (userRows[0].count === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await pool.query(`
        INSERT INTO users (email, password, name, phone) VALUES
        (?, ?, ?, ?)
      `, ['ahmad.z@example.com', hashedPassword, 'Ahmad Zulkifli', '+60123456789']);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export default pool;
