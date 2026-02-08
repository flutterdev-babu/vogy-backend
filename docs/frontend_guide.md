# Admin Dashboard - Frontend Integration Guide

This document provides a comprehensive overview of the Vogy/Ara Admin Dashboard system, including the governance structure, entity relationships, and all available API endpoints.

---

## 🏛 System Governance & Hierarchy

The system has shifted from an Agent-managed model to a **Centralized Admin Governance** model.

### 1. Super Admin (Central Authority)
- **Role**: The ultimate authority in the system.
- **Capabilities**:
    - Full CRUD over all entities (Vendors, Partners, Vehicles, Agents, Corporates).
    - Management of global and city-wise pricing configurations.
    - Management of Vehicle Types and City Codes.
    - **Entity Linking**: Manages the "Attachment" system to link Vendors, Partners, and Vehicles.
    - **Manual Bookings**: Handles manual ride creation and partner assignment.

### 2. Agents (Brand Ambassadors & Referrers)
- **Role**: Primarily focused on market expansion and customer referral.
- **Agent Code**: Each agent has a unique `agentCode`. Customers can use this code during booking to receive discounts.
- **Tracking**: Admin can track which rides were sourced by which agent.
- **Decoupling**: Agents are no longer responsible for managing vendor operations; this is now handled directly by the Super Admin.

### 3. Vendors (Service Providers)
- **Role**: Owners of vehicles and employers/partners of drivers.
- **Operations**: Vendors provide vehicles and partners to the platform.
- **Revenue**: Linked to rides for settlement and commission tracking.

### 4. Partners (Captains/Drivers)
- **Role**: The individual executing the rides.
- **Flexible Model**: A Partner can be an employee of a Vendor (using vendor's vehicle) OR an individual owner-operator (using their own vehicle).

### 5. Attachments (The Linking System)
- **Purpose**: To ensure operational integrity, a **Partner** must be "attached" to a **Vehicle** and a **Vendor** to perform rides.
- **Constraint**: Admin manages these attachments to maintain a clear audit trail of who is driving what and under which vendor.

---

## 🔐 Authentication

### Admin Registration
**POST** `/api/admin/auth/register`
*Note: Requires a 10-digit secret key.*

**Payload:**
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securepassword",
  "role": "SUPERADMIN", // or SUBADMIN
  "secretKey": "1234567890" // Configurable in .env
}
```

### Admin Login
**POST** `/api/admin/auth/login`
**Payload:** `{ "email": "...", "password": "..." }`

---

## 🏙 City & Pricing Management

### City Codes
- **List**: `GET /api/admin/city-codes`
- **Create**: `POST /api/admin/city-codes`
- **Update**: `PUT/PATCH /api/admin/city-codes/:id`

### Vehicle Types
- **List**: `GET /api/admin/vehicle-types`
- **Create**: `POST /api/admin/vehicle-types`
- **Update**: `PUT/PATCH /api/admin/vehicle-types/:id`

### Pricing Configuration
- **Global Config**: `GET /api/admin/pricing-config` | `PUT /api/admin/pricing-config`
- **City-wise Pricing**: Managed within City Code endpoints or specialized pricing services.

---

## 🚛 Entity Management (CRUD)

### Vendors
- **Create**: `POST /api/admin/vendors`
- **List**: `GET /api/admin/vendors`
- **Get**: `GET /api/admin/vendors/:id`
- **Update**: `PUT/PATCH /api/admin/vendors/:id`

### Partners
- **Create**: `POST /api/admin/partners`
- **List**: `GET /api/admin/partners`
- **Status Toggle**: `PATCH /api/admin/partners/:id/status` (APPROVED, SUSPENDED, etc.)
- **Analytics**: `GET /api/admin/partners/:id/analytics`

### Vehicles
- **Create**: `POST /api/admin/vehicles`
- **List**: `GET /api/admin/vehicles`
- **Assign to Vendor**: `POST /api/admin/vehicles/:id/assign-vendor`

### Attachments (Entity Linking)
- **Create**: `POST /api/admin/attachments`
- **List**: `GET /api/admin/attachments`
- **Delete**: `DELETE /api/admin/attachments/:id`

---

## 🚕 Ride Management

### Manual Bookings
Used when a customer calls the office instead of using the app.
**POST** `/api/admin/rides`

**Payload:**
```json
{
  "userPhone": "+91...",
  "userName": "Customer",
  "vehicleTypeId": "uuid",
  "cityCodeId": "uuid",
  "pickupLat": 12.3,
  "pickupLng": 77.4,
  "pickupAddress": "Starting point",
  "dropLat": 12.5,
  "dropLng": 77.6,
  "dropAddress": "Destination",
  "distanceKm": 15.5,
  "scheduledDateTime": "2026-02-10T10:00:00Z"
}
```

### Partner Assignment
Assign a Captain to a scheduled/manual ride.
**POST** `/api/admin/rides/:rideId/assign-rider`
**Payload:** `{ "partnerId": "uuid" }`

### Ride List & History
- **All Rides**: `GET /api/admin/rides`
- **Scheduled Only**: `GET /api/admin/rides/scheduled`

---

## 👤 User Management (Riders)
- **List**: `GET /api/admin/users`
- **OTP Generation**: `POST /api/admin/users/:id/regenerate-otp` (Used to help users who can't see their OTP).

---

## 🏢 Corporate Management
- **List**: `GET /api/admin/corporates`
- **Billing**: `GET /api/admin/billing` | `POST /api/admin/billing`
- **Payments**: `GET /api/admin/payments` | `POST /api/admin/payments`

---

## 🆔 Custom ID Formats
All entities use a location-based custom ID format:
- **Agents**: `ICABLR01` (IC + A + CITY + SERIAL)
- **Vendors**: `ICVBLR01` (IC + V + CITY + SERIAL)
- **Partners**: `ICPBLR01` (IC + P + CITY + SERIAL)
- **Vehicles**: `ICVHBLR01` (IC + VH + CITY + SERIAL)
- **Rides**: `ICRBLR0001` (IC + R + CITY + 4-DIGIT-SERIAL)
