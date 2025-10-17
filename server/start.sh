#!/bin/bash

# Debug environment variables
echo "=== Environment Variables Debug ==="
echo "PORT: $PORT"
echo "PGHOST: $PGHOST"
echo "PGPORT: $PGPORT"
echo "PGDATABASE: $PGDATABASE"
echo "PGUSER: $PGUSER"
echo "PGPASSWORD: [HIDDEN]"
echo "DATABASE_URL: $DATABASE_URL"
echo "=================================="

# Parse DATABASE_URL if individual PostgreSQL variables are not set
if [ -z "$PGHOST" ] && [ -n "$DATABASE_URL" ]; then
    echo "Parsing DATABASE_URL for PostgreSQL connection details..."
    # Extract components from DATABASE_URL (format: postgresql://user:password@host:port/database)
    DB_URL_WITHOUT_PROTOCOL=${DATABASE_URL#postgresql://}
    DB_CREDENTIALS=${DB_URL_WITHOUT_PROTOCOL%%@*}
    DB_HOST_PORT_DB=${DB_URL_WITHOUT_PROTOCOL#*@}
    
    if [ "$DB_CREDENTIALS" != "$DB_URL_WITHOUT_PROTOCOL" ]; then
        # Has credentials
        DB_USER=${DB_CREDENTIALS%%:*}
        DB_PASSWORD=${DB_CREDENTIALS#*:}
        DB_HOST_PORT=${DB_HOST_PORT_DB%%/*}
        DB_NAME=${DB_HOST_PORT_DB#*/}
        DB_HOST=${DB_HOST_PORT%%:*}
        DB_PORT=${DB_HOST_PORT#*:}
        
        # Set environment variables
        export PGHOST=$DB_HOST
        export PGPORT=${DB_PORT:-5432}
        export PGDATABASE=$DB_NAME
        export PGUSER=$DB_USER
        export PGPASSWORD=$DB_PASSWORD
        
        echo "Parsed from DATABASE_URL:"
        echo "PGHOST: $PGHOST"
        echo "PGPORT: $PGPORT"
        echo "PGDATABASE: $PGDATABASE"
        echo "PGUSER: $PGUSER"
        echo "PGPASSWORD: [HIDDEN]"
    fi
fi

# Show final connection details
echo "Final database connection details:"
echo "Connection URL: jdbc:postgresql://$PGHOST:$PGPORT/$PGDATABASE"
echo "Username: $PGUSER"
echo "Password: [HIDDEN]"

# Test database connectivity
echo "Testing database connectivity..."
if command -v nc >/dev/null 2>&1; then
    echo "Testing connection to $PGHOST:$PGPORT..."
    if nc -z -w5 "$PGHOST" "$PGPORT" 2>/dev/null; then
        echo "✓ Database port is reachable"
    else
        echo "✗ Cannot reach database port $PGHOST:$PGPORT"
        echo "This might indicate:"
        echo "  - Database service is not running"
        echo "  - Database service is not properly linked to this service"
        echo "  - Network connectivity issues"
    fi
else
    echo "nc (netcat) not available, skipping connectivity test"
fi

# Render provides PORT, default to 10000
PORT=${PORT:-10000}
echo "Starting app on port $PORT..."

# Start Spring Boot with JVM optimizations for faster startup
java -Dserver.port=$PORT \
     -XX:+UseG1GC \
     -XX:+UseStringDeduplication \
     -XX:+OptimizeStringConcat \
     -XX:+UseCompressedOops \
     -XX:+UseCompressedClassPointers \
     -Xms256m \
     -Xmx512m \
     -Dspring.jmx.enabled=false \
     -Dspring.main.lazy-initialization=true \
     -Dspring.jpa.defer-datasource-initialization=true \
     -Dspring.datasource.hikari.connection-timeout=10000 \
     -Dspring.datasource.hikari.validation-timeout=5000 \
     -Dspring.datasource.hikari.login-timeout=10000 \
     -Dspring.profiles.active=prod \
     -jar /app/app.jar
