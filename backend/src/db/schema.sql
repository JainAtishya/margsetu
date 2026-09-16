-- ==========================================
-- MARGSETU DATABASE SCHEMA (V1)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Operators (Admins)
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drivers
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buses
CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    capacity INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Routes
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    route_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Stops
CREATE TABLE stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Route Stops (Many-to-Many join table)
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES stops(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    UNIQUE(route_id, stop_sequence), -- Cannot have two "Stop 1"s on the same route
    UNIQUE(route_id, stop_id)        -- Cannot have the exact same stop twice on a route
);

-- 7. Trips (The active journey)
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id),
    bus_id UUID REFERENCES buses(id),
    driver_id UUID REFERENCES drivers(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED')),
    scheduled_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === CRITICAL RACE CONDITION PREVENTION ===
-- Ensure a driver or bus can only have ONE 'ACTIVE' trip at a time.
CREATE UNIQUE INDEX one_active_trip_per_driver ON trips (driver_id) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX one_active_trip_per_bus ON trips (bus_id) WHERE status = 'ACTIVE';


-- 8. Refresh Tokens (For Secure Authentication & Rotation)
CREATE TABLE refresh_tokens (
    token UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,          -- Groups tokens from the same login session
    is_used BOOLEAN DEFAULT FALSE,    -- Triggers theft detection if someone uses a used token
    is_revoked BOOLEAN DEFAULT FALSE, -- Kills the token manually
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 9. Location Updates (Time-series log)
CREATE TABLE location_updates (
    id BIGSERIAL PRIMARY KEY,  -- BIGSERIAL for high-write performance, not UUID
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    gps_timestamp TIMESTAMPTZ NOT NULL, -- When the phone took the reading
    received_at TIMESTAMPTZ DEFAULT NOW(), -- When the server got it
    source VARCHAR(20) CHECK (source IN ('INTERNET', 'SMS')) NOT NULL,
    
    -- === SMS DEDUPLICATION (IDEMPOTENCY) ===
    -- If the SMS gateway sends the exact same GPS ping twice, ignore it.
    UNIQUE(trip_id, gps_timestamp)
);

-- === FAST PASSENGER READS ===
-- Allows finding the "latest location" for a trip instantly without scanning the whole table.
CREATE INDEX idx_latest_location ON location_updates (trip_id, gps_timestamp DESC);
