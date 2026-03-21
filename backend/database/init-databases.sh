#!/bin/bash
# PostgreSQL init script — creates all databases
# This runs automatically when the postgres container starts

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE identity_db;
    CREATE DATABASE tour_db;
    CREATE DATABASE booking_db;
    CREATE DATABASE itinerary_db;
    CREATE DATABASE notification_db;
EOSQL

# Run schema migrations
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "identity_db" -f /docker-entrypoint-initdb.d/schemas/identity_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "tour_db" -f /docker-entrypoint-initdb.d/schemas/tour_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "booking_db" -f /docker-entrypoint-initdb.d/schemas/booking_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "itinerary_db" -f /docker-entrypoint-initdb.d/schemas/itinerary_db.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "notification_db" -f /docker-entrypoint-initdb.d/schemas/notification_db.sql
