# Phase 2: High-Level Design (HLD)

## The System Components
1. **Driver Android App:** Captures GPS every 15 seconds. Tries to send via HTTP. If that fails, sends via SMS.
2. **Passenger Android App:** Connects to the backend via WebSockets to listen for live location updates.
3. **SMS Gateway App:** A custom Android app running on a cheap physical phone in the office. Its only job is to read incoming SMS messages and forward them to our backend via HTTP.
4. **Node.js Backend (Express + Socket.IO):** The brain. Validates data, writes to the database, and pushes real-time updates to connected passengers.
5. **PostgreSQL Database:** Stores all relational data and the time-series GPS logs.

## The Two Critical Data Flows

### Flow A: The "Happy Path" (Driver has 4G Internet)
1. Driver App gets GPS coordinate.
2. Driver App sends `POST /api/driver/location` (HTTP) to Node.js Backend.
3. Node.js validates and writes the location to PostgreSQL.
4. Node.js instantly pushes the new coordinate via **Socket.IO** to all Passenger Apps currently viewing that bus.

### Flow B: The "Dead Zone Path" (Driver has NO Internet)
1. Driver App tries HTTP, fails. 
2. Driver App formats an SMS and sends it over the cellular network.
3. The physical **SMS Gateway Phone** receives the text.
4. The Gateway App reads the text and sends `POST /api/sms/incoming` via its office WiFi to the Node.js Backend.
5. Node.js processes it exactly like an HTTP request, writes to DB, and pushes to Socket.IO.

## Key Decisions
* **Why Node.js?** GPS tracking is highly "I/O bound". Node.js's event loop handles thousands of concurrent HTTP requests and WebSocket connections highly efficiently.
* **Why WebSockets instead of HTTP Polling?** HTTP Polling crushes the server and drains passenger battery. WebSockets allow a single persistent connection where the server *pushes* data only when a driver moves.
