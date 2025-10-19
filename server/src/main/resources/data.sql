-- Default users for the room booking system
-- This script runs automatically when the application starts

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    userid VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- Insert Owner user
INSERT INTO users (userid, password, role, name) 
VALUES ('owner', 'owner123', 'OWNER', 'Property Owner')
ON CONFLICT (userid) DO NOTHING;

-- Insert Caretaker user  
INSERT INTO users (userid, password, role, name) 
VALUES ('caretaker', 'caretaker123', 'CARETAKER', 'Property Caretaker')
ON CONFLICT (userid) DO NOTHING;

-- Make password column nullable in customer table
ALTER TABLE customer ALTER COLUMN password DROP NOT NULL;
