#!/bin/bash

# Local PostgreSQL Setup Script for Room Booking App
# This script helps set up a local PostgreSQL database for development

echo "🏠 Setting up local PostgreSQL database for Room Booking App..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL service is not running. Please start PostgreSQL first."
    echo "   macOS: brew services start postgresql"
    echo "   Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Database configuration
DB_NAME="room_booking_db"
DB_USER="roombooking"
DB_PASSWORD="roombooking123"

echo "📊 Creating database and user..."

# Create database and user
sudo -u postgres psql << EOF
-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema privileges
\c $DB_NAME;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully!"
else
    echo "❌ Failed to create database and user."
    exit 1
fi

echo "📝 Setting up database schema and sample data..."

# Run the database setup script
psql -h localhost -U $DB_USER -d $DB_NAME -f server/src/main/resources/complete_database_setup_postgresql.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema and sample data created successfully!"
else
    echo "❌ Failed to set up database schema."
    exit 1
fi

echo ""
echo "🎉 Local PostgreSQL setup completed!"
echo ""
echo "📋 Database Information:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo "🔗 Connection String:"
echo "   postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "🚀 Next Steps:"
echo "   1. Update your application.properties to use PostgreSQL"
echo "   2. Start your Spring Boot application"
echo "   3. Test the API endpoints"
echo ""
echo "👤 Default Login Credentials:"
echo "   Owner: username=owner, password=password123"
echo "   Caretaker: username=caretaker, password=password123"
echo "   Customer: phone=9876543210, password=password123"
echo ""
