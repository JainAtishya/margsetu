# Phase 4: API Design

## 1. Driver APIs (Protected by JWT)
* `POST /api/driver/auth/login` -> Authenticates. Returns a JWT token.
* `GET /api/driver/trip` -> Fetches the trip assigned to this driver for today.
* `POST /api/driver/trip/:id/start` -> Updates trip status to `ACTIVE`.
* `POST /api/driver/trip/:id/location` -> The core HTTP tracking endpoint. (Body: `{ latitude, longitude, gps_timestamp }`)
* `POST /api/driver/trip/:id/end` -> Updates trip status to `COMPLETED`.

## 2. SMS Gateway API (Protected by Secret Header)
* `POST /api/sms/incoming` -> The gateway phone forwards SMS messages here.
  * *Header:* `x-gateway-secret`
  * *Body:* `{ from: "+91...", message: "MSLOC|trip_123|26.5|74.8|timestamp" }`

## 3. Passenger APIs (Public)
* `GET /api/passenger/buses/active` -> Returns a list of all currently `ACTIVE` trips and their last known locations.

## 4. Real-Time WebSockets
* **Passenger to Server:** `join_trip` (Payload: `trip_id`) - Joins a specific Socket.IO room.
* **Passenger to Server:** `leave_trip` (Payload: `trip_id`) - Leaves the room.
* **Server to Passenger:** `location_update` (Payload: `{ latitude, longitude }`) - Broadcasts to everyone in that trip's room.
