# MargSetu: Real-Time Transit Tracking System

## Overview
MargSetu is a production-ready fleet management and public transit tracking system. It is specifically architected to handle rural environments where mobile internet connectivity is highly inconsistent. The system provides real-time GPS tracking for passengers while ensuring zero data loss during driver network outages.

## System Architecture
The platform consists of four loosely coupled components:
1. **Node.js Backend**: REST API and WebSocket server (Express + Socket.IO).
2. **PostgreSQL Database**: Relational data and time-series GPS logs.
3. **Driver Application (Android)**: Transmits GPS data via HTTP, or falls back to SMS.
4. **Passenger Application (Android)**: Consumes WebSocket events for real-time map updates.
5. **SMS Gateway (Android)**: A physical device acting as an ingestion point for offline driver updates.

## Key Engineering Decisions

### 1. SMS Fallback and Idempotency
To solve the problem of cellular dead-zones, the Driver App seamlessly switches from HTTP to SMS when the network drops. The backend ingests these SMS messages via a Gateway. 
* **Database Constraint:** A composite unique index on `(trip_id, gps_timestamp)` ensures that if the telecom network duplicates an SMS, the backend silently ignores the duplicate, guaranteeing idempotency.

### 2. Authentication & Refresh Token Rotation (RTR)
Driver sessions are managed using stateless JSON Web Tokens (JWT).
* To mitigate the risk of token theft, the system employs Refresh Token Rotation.
* Every time an Access Token is refreshed, the backend rotates the Refresh Token.
* **Reuse Detection:** If an attacker attempts to use an already-rotated Refresh Token, the backend detects the anomaly and immediately revokes the entire token family, securing the driver's session.

### 3. Database Race Condition Prevention
The system strictly enforces that a driver or a bus can only have one active trip at a given time.
* Rather than relying on application-level checks (which are vulnerable to race conditions), this is enforced at the database level using a **Partial Unique Index**:
  `CREATE UNIQUE INDEX one_active_trip_per_driver ON trips (driver_id) WHERE status = 'ACTIVE';`

### 4. Read/Write Optimization
The `location_updates` table acts as a high-volume append-only log (optimized for writes using `BIGSERIAL`). To ensure passenger read requests do not cause full table scans, a composite index on `(trip_id, gps_timestamp DESC)` allows O(log N) retrieval of the latest bus location.

## Local Setup

### Prerequisites
* Node.js (v18+)
* PostgreSQL (v14+)

### Backend Initialization
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=margsetu
   JWT_SECRET=your_secure_random_string
   ```
4. Seed the database (creates tables and inserts test data):
   ```bash
   node src/db/seed.js
   ```
5. Start the server:
   ```bash
   node src/index.js
   ```

## API Documentation
Detailed architectural documents and API contracts can be found in the `/docs` directory.
