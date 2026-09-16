# Phase 1: Domain Modeling

## 1. Static Entities (The Setup)
* **Operator:** The fleet manager/admin.
* **Driver & Bus:** The people and vehicles. 
* **Route, Stop, & Route_Stops:** A Route (e.g., "R1: Ajmer to Masuda") is a collection of Stops in a specific order.

## 2. Dynamic Entities (The Live System)
* **The "Trip" Entity.**
  * *Why?* We cannot just link a Driver to a Route. A Route is a static path. A **Trip** is an *instance* of a Route happening right now. It ties together `1 Driver + 1 Bus + 1 Route + Today's Date`. The Trip has a status (`PENDING`, `ACTIVE`, `COMPLETED`).
* **The "Location_Update" Entity.**
  * *Why?* We do not just update a Trip's current location. We append every single GPS ping (Lat/Lon/Timestamp) as a new row linked to the Trip. This gives us historical auditing and avoids heavy write-locking (MVCC bloat) on the Trips table.
