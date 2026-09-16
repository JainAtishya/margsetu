# Phase 3: Low-Level Design (LLD)

## 1. Database Schema
* **operators:** `id` (UUID), `name`, `email`, `password_hash`
* **drivers:** `id` (UUID), `operator_id` (FK), `name`, `phone`, `password_hash`
* **buses:** `id` (UUID), `operator_id` (FK), `registration_number`
* **routes:** `id` (UUID), `operator_id` (FK), `route_code`, `name`
* **stops:** `id` (UUID), `operator_id` (FK), `name`, `latitude`, `longitude`
* **route_stops:** `id` (UUID), `route_id` (FK), `stop_id` (FK), `stop_sequence`
* **trips:** `id` (UUID), `route_id`, `bus_id`, `driver_id`, `status` (PENDING, ACTIVE, COMPLETED), `date`
* **location_updates:** `id` (BIGSERIAL), `trip_id` (FK), `latitude`, `longitude`, `gps_timestamp`, `received_at`, `source` (INTERNET/SMS)

### Critical Database Safeguards
1. **Race Condition Prevention:** Partial Unique Index on `trips`. A driver/bus can only have ONE trip where `status = 'ACTIVE'`.
2. **SMS Deduplication:** Unique constraint on `location_updates (trip_id, gps_timestamp)`. If the SMS gateway sends the exact same ping twice, the DB silently ignores the duplicate.

## 2. Backend Architecture (MVC + Service Layer)
* **Routes:** Defines the URL endpoints.
* **Controllers:** Extracts data from the HTTP request, calls the Service, sends the HTTP response.
* **Services:** The Brain. Contains all business rules (e.g., saving location, validating trips, broadcasting via Socket.IO). 
  * *Why?* Allows both HTTP Controllers and SMS Controllers to reuse the exact same core logic.
* **Models:** Contains raw SQL queries.
