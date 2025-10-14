-- =====================================================
-- Room Booking App - PostgreSQL Database Setup
-- =====================================================
-- This script creates the complete database schema for PostgreSQL
-- Compatible with Heroku Postgres

-- =====================================================
-- DROP EXISTING TABLES (if any)
-- =====================================================
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS booking_request CASCADE;
DROP TABLE IF EXISTS expense CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Users table for authentication
CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'CARETAKER')),
  name VARCHAR(255) NOT NULL
);

-- Customer table
CREATE TABLE customer (
  phone_number VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  additional_phone_number VARCHAR(20),
  documents_folder_link TEXT,
  photo_id_proof_url TEXT,
  id_proof_urls TEXT[], -- PostgreSQL array for multiple URLs
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room table
CREATE TABLE room (
  id BIGSERIAL PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('SINGLE', 'DOUBLE', 'SUITE')),
  bathroom_type VARCHAR(20) NOT NULL CHECK (bathroom_type IN ('PRIVATE', 'SHARED')),
  is_available BOOLEAN DEFAULT TRUE,
  daily_reference_cost DECIMAL(10,2) DEFAULT 0.00,
  monthly_reference_cost DECIMAL(10,2) DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking Request table
CREATE TABLE booking_request (
  id BIGSERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  room_id BIGINT NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  check_in_date TIMESTAMP NOT NULL,
  check_out_date TIMESTAMP NOT NULL,
  booking_duration_type VARCHAR(20) NOT NULL CHECK (booking_duration_type IN ('DAILY', 'MONTHLY')),
  daily_cost DECIMAL(10,2) DEFAULT 0.00,
  monthly_cost DECIMAL(10,2) DEFAULT 0.00,
  early_checkin_cost DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking table
CREATE TABLE booking (
  id BIGSERIAL PRIMARY KEY,
  customer_phone_number VARCHAR(20) NOT NULL REFERENCES customer(phone_number) ON DELETE CASCADE,
  room_id BIGINT NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  check_in_date TIMESTAMP NOT NULL,
  check_out_date TIMESTAMP NOT NULL,
  booking_duration_type VARCHAR(20) NOT NULL CHECK (booking_duration_type IN ('DAILY', 'MONTHLY')),
  booking_status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (booking_status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
  daily_cost DECIMAL(10,2) DEFAULT 0.00,
  monthly_cost DECIMAL(10,2) DEFAULT 0.00,
  early_checkin_cost DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment table
CREATE TABLE payment (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  payment_screenshot_url TEXT,
  transaction_id VARCHAR(255),
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense table
CREATE TABLE expense (
  id BIGSERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('MAINTENANCE', 'UTILITIES', 'CLEANING', 'SECURITY', 'ADMINISTRATIVE', 'REPAIRS', 'SUPPLIES', 'OTHER')),
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Customer indexes
CREATE INDEX idx_customer_phone ON customer(phone_number);
CREATE INDEX idx_customer_email ON customer(email);

-- Room indexes
CREATE INDEX idx_room_number ON room(room_number);
CREATE INDEX idx_room_type ON room(room_type);
CREATE INDEX idx_room_availability ON room(is_available);

-- Booking Request indexes
CREATE INDEX idx_booking_request_customer_phone ON booking_request(customer_phone);
CREATE INDEX idx_booking_request_room_id ON booking_request(room_id);
CREATE INDEX idx_booking_request_status ON booking_request(status);
CREATE INDEX idx_booking_request_dates ON booking_request(check_in_date, check_out_date);

-- Booking indexes
CREATE INDEX idx_booking_customer_phone ON booking(customer_phone_number);
CREATE INDEX idx_booking_room_id ON booking(room_id);
CREATE INDEX idx_booking_status ON booking(booking_status);
CREATE INDEX idx_booking_dates ON booking(check_in_date, check_out_date);

-- Payment indexes
CREATE INDEX idx_payment_booking_id ON payment(booking_id);
CREATE INDEX idx_payment_status ON payment(payment_status);
CREATE INDEX idx_payment_date ON payment(payment_date);

-- Expense indexes
CREATE INDEX idx_expense_category ON expense(category);
CREATE INDEX idx_expense_date ON expense(expense_date);

-- Users indexes
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert default users
INSERT INTO users (user_id, password, role, name) VALUES
('owner', 'owner123', 'OWNER', 'Property Owner'),
('caretaker', 'caretaker123', 'CARETAKER', 'Property Caretaker');

-- Insert sample customers
INSERT INTO customer (phone_number, name, email, password, additional_phone_number, documents_folder_link, photo_id_proof_url, id_proof_urls, remarks) VALUES
('1234567890', 'John Smith', 'john.smith@email.com', 'password123', '+1234567891', 'https://drive.google.com/folder/john_smith', 'https://drive.google.com/file/john_photo_id', ARRAY['https://drive.google.com/file/john_id1', 'https://drive.google.com/file/john_id2'], 'Regular customer, prefers quiet rooms'),
('2345678901', 'Sarah Johnson', 'sarah.johnson@email.com', 'password123', '+2345678902', 'https://drive.google.com/folder/sarah_johnson', 'https://drive.google.com/file/sarah_photo_id', ARRAY['https://drive.google.com/file/sarah_id1'], 'Business traveler, needs WiFi'),
('3456789012', 'Mike Wilson', 'mike.wilson@email.com', 'password123', '+3456789013', 'https://drive.google.com/folder/mike_wilson', 'https://drive.google.com/file/mike_photo_id', ARRAY['https://drive.google.com/file/mike_id1', 'https://drive.google.com/file/mike_id2', 'https://drive.google.com/file/mike_id3'], 'Long-term stay customer'),
('4567890123', 'Emily Davis', 'emily.davis@email.com', 'password123', '+4567890124', 'https://drive.google.com/folder/emily_davis', 'https://drive.google.com/file/emily_photo_id', ARRAY['https://drive.google.com/file/emily_id1'], 'Tourist, needs local recommendations'),
('5678901234', 'David Brown', 'david.brown@email.com', 'password123', '+5678901235', 'https://drive.google.com/folder/david_brown', 'https://drive.google.com/file/david_photo_id', ARRAY['https://drive.google.com/file/david_id1', 'https://drive.google.com/file/david_id2'], 'Student, budget-conscious'),
('6789012345', 'Lisa Anderson', 'lisa.anderson@email.com', 'password123', '+6789012346', 'https://drive.google.com/folder/lisa_anderson', 'https://drive.google.com/file/lisa_photo_id', ARRAY['https://drive.google.com/file/lisa_id1'], 'Family with children, needs extra space'),
('7890123456', 'Robert Taylor', 'robert.taylor@email.com', 'password123', '+7890123457', 'https://drive.google.com/folder/robert_taylor', 'https://drive.google.com/file/robert_photo_id', ARRAY['https://drive.google.com/file/robert_id1'], 'Senior citizen, needs accessible room'),
('8901234567', 'Jennifer Martinez', 'jennifer.martinez@email.com', 'password123', '+8901234568', 'https://drive.google.com/folder/jennifer_martinez', 'https://drive.google.com/file/jennifer_photo_id', ARRAY['https://drive.google.com/file/jennifer_id1'], 'Corporate client, needs meeting facilities'),
('9012345678', 'Michael Chen', 'michael.chen@email.com', 'password123', '+9012345679', 'https://drive.google.com/folder/michael_chen', 'https://drive.google.com/file/michael_photo_id', ARRAY['https://drive.google.com/file/michael_id1'], 'Tech professional, needs high-speed internet'),
('0123456789', 'Amanda White', 'amanda.white@email.com', 'password123', '+0123456780', 'https://drive.google.com/folder/amanda_white', 'https://drive.google.com/file/amanda_photo_id', ARRAY['https://drive.google.com/file/amanda_id1'], 'Artist, needs quiet workspace');

-- Insert sample rooms
INSERT INTO room (room_number, room_type, bathroom_type, is_available, daily_reference_cost, monthly_reference_cost, description) VALUES
('101', 'SINGLE', 'PRIVATE', TRUE, 1500.00, 45000.00, 'Cozy single room with private bathroom and city view'),
('102', 'SINGLE', 'SHARED', TRUE, 1200.00, 36000.00, 'Single room with shared bathroom, perfect for budget travelers'),
('103', 'DOUBLE', 'PRIVATE', TRUE, 2500.00, 75000.00, 'Spacious double room with private bathroom and balcony'),
('104', 'DOUBLE', 'SHARED', TRUE, 2000.00, 60000.00, 'Double room with shared bathroom, ideal for couples'),
('105', 'SUITE', 'PRIVATE', TRUE, 4000.00, 120000.00, 'Luxury suite with private bathroom, living area, and kitchenette'),
('201', 'SINGLE', 'PRIVATE', TRUE, 1500.00, 45000.00, 'Second floor single room with private bathroom and garden view'),
('202', 'DOUBLE', 'PRIVATE', TRUE, 2500.00, 75000.00, 'Second floor double room with private bathroom and mountain view'),
('203', 'SUITE', 'PRIVATE', TRUE, 4000.00, 120000.00, 'Second floor suite with private bathroom and panoramic city view'),
('301', 'SINGLE', 'PRIVATE', TRUE, 1500.00, 45000.00, 'Third floor single room with private bathroom and rooftop access'),
('302', 'DOUBLE', 'PRIVATE', TRUE, 2500.00, 75000.00, 'Third floor double room with private bathroom and premium amenities'),
('303', 'SUITE', 'PRIVATE', TRUE, 4000.00, 120000.00, 'Penthouse suite with private bathroom, terrace, and premium services'),
('401', 'SINGLE', 'PRIVATE', FALSE, 1500.00, 45000.00, 'Fourth floor single room - currently under maintenance');

-- Insert sample booking requests
INSERT INTO booking_request (customer_name, customer_phone, room_id, check_in_date, check_out_date, booking_duration_type, daily_cost, monthly_cost, early_checkin_cost, total_amount, status, remarks) VALUES
('John Smith', '1234567890', 1, '2024-12-15 10:00:00', '2024-12-17 10:00:00', 'DAILY', 1500.00, 0.00, 0.00, 3000.00, 'PENDING', 'Requesting early check-in if possible'),
('Sarah Johnson', '2345678901', 3, '2024-12-16 10:00:00', '2024-12-19 10:00:00', 'DAILY', 2500.00, 0.00, 500.00, 8000.00, 'APPROVED', 'Business trip, needs quiet room'),
('Mike Wilson', '3456789012', 5, '2024-12-18 10:00:00', '2024-12-20 10:00:00', 'DAILY', 4000.00, 0.00, 0.00, 8000.00, 'PENDING', 'Anniversary celebration'),
('Emily Davis', '4567890123', 2, '2024-12-20 10:00:00', '2024-12-22 10:00:00', 'DAILY', 1200.00, 0.00, 0.00, 2400.00, 'REJECTED', 'Room not available for requested dates'),
('David Brown', '5678901234', 4, '2024-12-25 10:00:00', '2024-12-27 10:00:00', 'DAILY', 2000.00, 0.00, 0.00, 4000.00, 'PENDING', 'Holiday trip with family'),
('Lisa Anderson', '6789012345', 6, '2024-12-28 10:00:00', '2024-12-30 10:00:00', 'DAILY', 1500.00, 0.00, 0.00, 3000.00, 'APPROVED', 'New Year celebration'),
('Robert Taylor', '7890123456', 7, '2025-01-02 10:00:00', '2025-01-05 10:00:00', 'DAILY', 2500.00, 0.00, 0.00, 7500.00, 'PENDING', 'Medical appointment in city'),
('Jennifer Martinez', '8901234567', 8, '2025-01-10 10:00:00', '2025-01-12 10:00:00', 'DAILY', 4000.00, 0.00, 0.00, 8000.00, 'APPROVED', 'Corporate meeting'),
('Michael Chen', '9012345678', 9, '2025-01-15 10:00:00', '2025-01-17 10:00:00', 'DAILY', 1500.00, 0.00, 0.00, 3000.00, 'PENDING', 'Tech conference'),
('Amanda White', '0123456789', 10, '2025-01-20 10:00:00', '2025-01-22 10:00:00', 'DAILY', 2500.00, 0.00, 0.00, 5000.00, 'REJECTED', 'Artist retreat - needs more space');

-- Insert sample bookings
INSERT INTO booking (customer_phone_number, room_id, check_in_date, check_out_date, booking_duration_type, booking_status, daily_cost, monthly_cost, early_checkin_cost, total_amount) VALUES
('1234567890', 1, '2024-11-01 10:00:00', '2024-11-03 10:00:00', 'DAILY', 'COMPLETED', 1500.00, 0.00, 0.00, 3000.00),
('2345678901', 3, '2024-11-05 10:00:00', '2024-11-08 10:00:00', 'DAILY', 'COMPLETED', 2500.00, 0.00, 500.00, 8000.00),
('3456789012', 5, '2024-11-10 10:00:00', '2024-11-12 10:00:00', 'DAILY', 'COMPLETED', 4000.00, 0.00, 0.00, 8000.00),
('4567890123', 2, '2024-11-15 10:00:00', '2024-11-17 10:00:00', 'DAILY', 'COMPLETED', 1200.00, 0.00, 0.00, 2400.00),
('5678901234', 4, '2024-11-20 10:00:00', '2024-11-22 10:00:00', 'DAILY', 'COMPLETED', 2000.00, 0.00, 0.00, 4000.00),
('6789012345', 6, '2024-11-25 10:00:00', '2024-11-27 10:00:00', 'DAILY', 'COMPLETED', 1500.00, 0.00, 0.00, 3000.00),
('7890123456', 7, '2024-12-01 10:00:00', '2024-12-03 10:00:00', 'DAILY', 'CONFIRMED', 2500.00, 0.00, 0.00, 5000.00),
('8901234567', 8, '2024-12-05 10:00:00', '2024-12-07 10:00:00', 'DAILY', 'CONFIRMED', 4000.00, 0.00, 0.00, 8000.00),
('9012345678', 9, '2024-12-10 10:00:00', '2024-12-12 10:00:00', 'DAILY', 'CONFIRMED', 1500.00, 0.00, 0.00, 3000.00),
('0123456789', 10, '2024-12-12 10:00:00', '2024-12-14 10:00:00', 'DAILY', 'CONFIRMED', 2500.00, 0.00, 0.00, 5000.00);

-- Insert sample payments
INSERT INTO payment (booking_id, amount, payment_method, payment_status, payment_screenshot_url, transaction_id, payment_date) VALUES
(1, 3000.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment1_screenshot', 'TXN123456789', '2024-11-01 10:30:00'),
(1, 0.00, 'CASH', 'COMPLETED', NULL, NULL, '2024-11-01 10:30:00'),
(2, 8000.00, 'BANK_TRANSFER', 'COMPLETED', 'https://drive.google.com/file/payment2_screenshot', 'TXN234567890', '2024-11-05 11:00:00'),
(3, 4000.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment3_screenshot', 'TXN345678901', '2024-11-10 10:45:00'),
(3, 4000.00, 'CARD', 'COMPLETED', 'https://drive.google.com/file/payment4_screenshot', 'TXN456789012', '2024-11-10 10:45:00'),
(4, 2400.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment5_screenshot', 'TXN567890123', '2024-11-15 09:30:00'),
(5, 2000.00, 'CASH', 'COMPLETED', NULL, NULL, '2024-11-20 10:15:00'),
(5, 2000.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment6_screenshot', 'TXN678901234', '2024-11-20 10:15:00'),
(6, 3000.00, 'BANK_TRANSFER', 'COMPLETED', 'https://drive.google.com/file/payment7_screenshot', 'TXN789012345', '2024-11-25 11:30:00'),
(7, 2500.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment8_screenshot', 'TXN890123456', '2024-12-01 10:00:00'),
(7, 2500.00, 'CARD', 'COMPLETED', 'https://drive.google.com/file/payment9_screenshot', 'TXN901234567', '2024-12-01 10:00:00'),
(8, 4000.00, 'BANK_TRANSFER', 'COMPLETED', 'https://drive.google.com/file/payment10_screenshot', 'TXN012345678', '2024-12-05 09:45:00'),
(8, 4000.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment11_screenshot', 'TXN123456780', '2024-12-05 09:45:00'),
(9, 1500.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment12_screenshot', 'TXN234567801', '2024-12-10 10:30:00'),
(9, 1500.00, 'CASH', 'COMPLETED', NULL, NULL, '2024-12-10 10:30:00'),
(10, 2500.00, 'CARD', 'COMPLETED', 'https://drive.google.com/file/payment13_screenshot', 'TXN345678012', '2024-12-12 11:00:00'),
(10, 2500.00, 'UPI', 'COMPLETED', 'https://drive.google.com/file/payment14_screenshot', 'TXN456780123', '2024-12-12 11:00:00'),
(1, 0.00, 'CASH', 'COMPLETED', NULL, NULL, '2024-11-03 10:00:00'),
(2, 0.00, 'CASH', 'COMPLETED', NULL, NULL, '2024-11-08 10:00:00'),
(3, 0.00, 'CASH', 'COMPLETED', NULL, NULL, '2024-11-12 10:00:00');

-- Insert sample expenses
INSERT INTO expense (description, amount, category, expense_date) VALUES
('Monthly electricity bill', 15000.00, 'UTILITIES', '2024-11-01'),
('Water bill payment', 5000.00, 'UTILITIES', '2024-11-01'),
('Internet service charge', 2000.00, 'UTILITIES', '2024-11-01'),
('Room cleaning supplies', 3000.00, 'CLEANING', '2024-11-02'),
('Security guard salary', 12000.00, 'SECURITY', '2024-11-05'),
('Maintenance - AC repair', 8000.00, 'MAINTENANCE', '2024-11-08'),
('Office supplies', 1500.00, 'ADMINISTRATIVE', '2024-11-10'),
('Plumbing repair', 4500.00, 'REPAIRS', '2024-11-12'),
('Toilet paper and soap', 2000.00, 'SUPPLIES', '2024-11-15'),
('Light bulb replacement', 800.00, 'MAINTENANCE', '2024-11-18'),
('Monthly gas bill', 3000.00, 'UTILITIES', '2024-11-20'),
('Deep cleaning service', 5000.00, 'CLEANING', '2024-11-22'),
('Door lock replacement', 2500.00, 'REPAIRS', '2024-11-25'),
('Monthly insurance premium', 8000.00, 'ADMINISTRATIVE', '2024-11-28'),
('Garden maintenance', 2000.00, 'MAINTENANCE', '2024-11-30'),
('Monthly electricity bill', 16000.00, 'UTILITIES', '2024-12-01'),
('Water bill payment', 5200.00, 'UTILITIES', '2024-12-01'),
('Internet service charge', 2000.00, 'UTILITIES', '2024-12-01'),
('Room cleaning supplies', 3200.00, 'CLEANING', '2024-12-02'),
('Security guard salary', 12000.00, 'SECURITY', '2024-12-05');

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_customer_updated_at BEFORE UPDATE ON customer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_updated_at BEFORE UPDATE ON room FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_request_updated_at BEFORE UPDATE ON booking_request FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_updated_at BEFORE UPDATE ON booking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON payment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_updated_at BEFORE UPDATE ON expense FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment these to verify the data was inserted correctly

-- SELECT 'Users' as Table_Name, COUNT(*) as Record_Count FROM users
-- UNION ALL
-- SELECT 'Customers', COUNT(*) FROM customer
-- UNION ALL
-- SELECT 'Rooms', COUNT(*) FROM room
-- UNION ALL
-- SELECT 'Booking Requests', COUNT(*) FROM booking_request
-- UNION ALL
-- SELECT 'Bookings', COUNT(*) FROM booking
-- UNION ALL
-- SELECT 'Payments', COUNT(*) FROM payment
-- UNION ALL
-- SELECT 'Expenses', COUNT(*) FROM expense;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
