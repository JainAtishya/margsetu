# Phase 0: Requirements (V1 Production MVP)

## 1. Actors & Core Flows
* **Operator:** Seeds the system with buses, routes, and schedules. (No UI in V1, handled via DB scripts).
* **Driver:** Logs into the Android app, sees their assigned trip for the day, hits "Start Trip", and the app broadcasts their GPS.
* **Passenger:** Opens the app (no login required) to see a list of active buses and view a bus moving live on a map.

## 2. Key Architectural Decisions
* **No Passenger Authentication.**
  * *Why?* Real-time transit data is public. Forcing logins reduces user adoption. It also removes the overhead of managing passenger sessions, GDPR/data deletion requests, and password resets for V1.
* **Driver SMS Fallback (Crucial).**
  * *Why?* Rural routes have massive internet dead zones. If the driver's app cannot reach our HTTP server, it falls back to sending an SMS containing GPS coordinates to a physical "Gateway Phone" sitting in our office, which then pushes the data to the backend. This guarantees continuous tracking.
* **Passenger SMS Queries.**
  * *Why?* To support passengers with feature phones or no data. They text `BUS RJ14-1234` to our Gateway Phone, and it texts back the latest location.
