# VOGY Backend - Frontend Integration Guide

> **Last Updated:** January 2, 2026  
> **Version:** 2.0 - Manual Ride Booking + Socket.IO

---

## Table of Contents
1. [Socket.IO Integration](#socket-io-integration)
2. [User APIs](#user-apis)
3. [Rider/Captain APIs](#ridercaptain-apis)
4. [Admin APIs](#admin-apis)
5. [Socket Events Reference](#socket-events-reference)
6. [Pricing Structure](#pricing-structure)
7. [Ride Status Flow](#ride-status-flow)

---

## Socket.IO Integration

### Connection Setup

```javascript
import { io } from "socket.io-client";

const API_URL = "http://your-server-url";

const socket = io(API_URL, {
  auth: {
    token: "JWT_TOKEN_HERE"  // Same token used for API calls
  },
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Connection handlers
socket.on("connect", () => console.log("✅ Socket connected"));
socket.on("disconnect", () => console.log("❌ Socket disconnected"));
socket.on("connect_error", (err) => console.log("Socket error:", err.message));
```

### Room Management

```javascript
// Join a specific ride room to receive real-time updates
socket.emit("ride:join", rideId);

// Leave ride room when navigating away
socket.emit("ride:leave", rideId);
```

---

## Public APIs (No Auth Required)

### Base URL: `/api/rides`

### 1. Get Fare Estimates ⭐

**Use this before booking to show user all vehicle options with prices. Optionally filter by nearby available captains.**

```http
GET /api/rides/fare-estimate?distanceKm=10&pickupLat=12.97&pickupLng=77.59&radiusKm=5
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `distanceKm` | number | Yes | Distance between pickup and drop |
| `pickupLat` | number | No | Pickup latitude (for filtering by nearby captains) |
| `pickupLng` | number | No | Pickup longitude (for filtering by nearby captains) |
| `radiusKm` | number | No | Search radius in km (default: 10km) |

**Response (200):**
```json
{
  "success": true,
  "message": "Fare estimates retrieved successfully",
  "data": {
    "distanceKm": 10,
    "locationFiltered": true,
    "pricingConfig": {
      "baseFare": 20,
      "riderPercentage": 80,
      "appCommission": 20
    },
    "fareEstimates": [
      {
        "vehicleTypeId": "abc123",
        "vehicleTypeName": "BIKE",
        "displayName": "Bike",
        "pricePerKm": 8,
        "baseFare": 20,
        "distanceKm": 10,
        "totalFare": 100,
        "riderEarnings": 80,
        "appCommission": 20,
        "nearbyDrivers": 5,
        "isAvailable": true
      },
      {
        "vehicleTypeId": "def456",
        "vehicleTypeName": "AUTO",
        "displayName": "Auto Rickshaw",
        "pricePerKm": 12,
        "baseFare": 20,
        "distanceKm": 10,
        "totalFare": 140,
        "riderEarnings": 112,
        "appCommission": 28,
        "nearbyDrivers": 3,
        "isAvailable": true
      },
      {
        "vehicleTypeId": "ghi789",
        "vehicleTypeName": "CAR",
        "displayName": "Car",
        "pricePerKm": 15,
        "baseFare": 20,
        "distanceKm": 10,
        "totalFare": 170,
        "riderEarnings": 136,
        "appCommission": 34,
        "nearbyDrivers": 0,
        "isAvailable": false
      }
    ]
  }
}
        "pricePerKm": 12,
        "baseFare": 20,
        "distanceKm": 10,
        "totalFare": 140,
        "riderEarnings": 112,
        "appCommission": 28
      },
      {
        "vehicleTypeId": "ghi789",
        "vehicleTypeName": "CAR",
        "displayName": "Car",
        "pricePerKm": 15,
        "baseFare": 20,
        "distanceKm": 10,
        "totalFare": 170,
        "riderEarnings": 136,
        "appCommission": 34
      }
    ]
  }
}
```

---

### 2. Get Vehicle Types

```http
GET /api/rides/vehicle-types
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "abc123", "name": "BIKE", "displayName": "Bike", "pricePerKm": 8 },
    { "id": "def456", "name": "AUTO", "displayName": "Auto Rickshaw", "pricePerKm": 12 },
    { "id": "ghi789", "name": "CAR", "displayName": "Car", "pricePerKm": 15 }
  ]
}
```

---

### 3. Get Pricing Config

```http
GET /api/rides/pricing
```

**Response:**
```json
{
  "success": true,
  "data": {
    "baseFare": 20,
    "riderPercentage": 80,
    "appCommission": 20
  }
}
```

---

## User APIs

### Base URL: `/api/user`

### 1. Create Instant Ride (Existing)

```http
POST /api/user/rides/new-ride
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request:**
```json
{
  "vehicleTypeId": "string (ObjectId)",
  "pickupLat": 12.9716,
  "pickupLng": 77.5946,
  "pickupAddress": "MG Road, Bangalore",
  "dropLat": 12.9352,
  "dropLng": 77.6245,
  "dropAddress": "Koramangala, Bangalore",
  "distanceKm": 8.5
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Ride created successfully",
  "data": {
    "id": "ride_id",
    "status": "PENDING",
    "isManualBooking": false,
    "baseFare": 20,
    "perKmPrice": 15,
    "totalFare": 147.5,
    "riderEarnings": 118,
    "commission": 29.5,
    "vehicleType": { "id": "...", "name": "CAR", "displayName": "Car" },
    "user": { "id": "...", "name": "John", "phone": "+91..." }
  }
}
```

---

### 2. Create Scheduled/Manual Ride (NEW)

```http
POST /api/user/rides/manual
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request:**
```json
{
  "vehicleTypeId": "string (ObjectId)",
  "pickupLat": 12.9716,
  "pickupLng": 77.5946,
  "pickupAddress": "MG Road, Bangalore",
  "dropLat": 12.9352,
  "dropLng": 77.6245,
  "dropAddress": "Koramangala, Bangalore",
  "distanceKm": 8.5,
  "scheduledDateTime": "2026-01-06T10:00:00.000Z",
  "bookingNotes": "Please arrive 10 minutes early"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicleTypeId` | string | Yes | Vehicle type ObjectId |
| `pickupLat` | number | Yes | Pickup latitude |
| `pickupLng` | number | Yes | Pickup longitude |
| `pickupAddress` | string | Yes | Pickup address text |
| `dropLat` | number | Yes | Drop latitude |
| `dropLng` | number | Yes | Drop longitude |
| `dropAddress` | string | Yes | Drop address text |
| `distanceKm` | number | Yes | Distance in kilometers |
| `scheduledDateTime` | string | Yes | ISO 8601 date (must be future) |
| `bookingNotes` | string | No | Optional notes for captain |

**Response (201):**
```json
{
  "success": true,
  "message": "Scheduled ride booked successfully",
  "data": {
    "id": "ride_id",
    "status": "SCHEDULED",
    "isManualBooking": true,
    "scheduledDateTime": "2026-01-06T10:00:00.000Z",
    "bookingNotes": "Please arrive 10 minutes early",
    "baseFare": 20,
    "totalFare": 147.5,
    ...
  }
}
```

---

### 3. Get All User Rides

```http
GET /api/user/rides/all-rides?status=SCHEDULED
Authorization: Bearer <user_token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Optional filter: PENDING, SCHEDULED, ACCEPTED, ARRIVED, STARTED, COMPLETED, CANCELLED |

---

### 4. Cancel Ride

```http
POST /api/user/rides/:id/cancel
Authorization: Bearer <user_token>
```

---

### 5. Complete Ride with OTP

```http
POST /api/user/rides/:id/complete
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request:**
```json
{
  "userOtp": "1234"
}
```

---

## Rider/Captain APIs

### Base URL: `/api/rider`

### 1. Get Available Rides

```http
GET /api/rider/rides/available?lat=12.97&lng=77.59
Authorization: Bearer <rider_token>
```

### 2. Accept Ride

```http
POST /api/rider/rides/:id/accept
Authorization: Bearer <rider_token>
```

### 3. Update Ride Status

```http
POST /api/rider/rides/:id/status
Authorization: Bearer <rider_token>
Content-Type: application/json
```

**Request:**
```json
{
  "status": "ARRIVED"  // or "STARTED"
}
```

### 4. Get Rider's Rides

```http
GET /api/rider/rides/my-rides?status=ACCEPTED
Authorization: Bearer <rider_token>
```

---

## Admin APIs

### Base URL: `/api/admin`

### 1. Get All Scheduled Rides (NEW)

```http
GET /api/admin/rides/scheduled
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ride_id",
      "status": "SCHEDULED",
      "scheduledDateTime": "2026-01-06T10:00:00.000Z",
      "user": { "id": "...", "name": "John", "phone": "+91..." },
      "vehicleType": { "name": "CAR", "displayName": "Car" },
      "pickupAddress": "...",
      "dropAddress": "...",
      "totalFare": 147.5
    }
  ]
}
```

---

### 2. Assign Rider to Scheduled Ride (NEW)

```http
POST /api/admin/rides/:id/assign-rider
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request:**
```json
{
  "riderId": "rider_object_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rider assigned to ride successfully",
  "data": {
    "id": "ride_id",
    "status": "ACCEPTED",
    "rider": { "id": "...", "name": "Captain Name", "phone": "...", "vehicleNumber": "KA01..." }
  }
}
```

---

### 3. Get All Riders (NEW)

```http
GET /api/admin/riders
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rider_id",
      "name": "Captain Name",
      "phone": "+91...",
      "vehicleNumber": "KA01AB1234",
      "vehicleModel": "Honda Activa",
      "isOnline": true,
      "rating": 4.8,
      "totalEarnings": 15000
    }
  ]
}
```

---

### 4. Update Pricing Config (UPDATED)

```http
PUT /api/admin/pricing-config
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request:**
```json
{
  "baseFare": 25,
  "riderPercentage": 80,
  "appCommission": 20
}
```

| Field | Type | Description |
|-------|------|-------------|
| `baseFare` | number | Flat base fare for all rides (NEW) |
| `riderPercentage` | number | % rider receives |
| `appCommission` | number | % app receives (must sum to 100 with riderPercentage) |

---

## Socket Events Reference

### User Receives These Events:

| Event | Data | Description |
|-------|------|-------------|
| `ride:created` | `{ message, ride }` | Ride booking confirmed |
| `ride:rider_assigned` | `{ message, ride }` | Admin assigned captain (for scheduled) |
| `ride:accepted` | `{ message, ride }` | Captain accepted ride |
| `ride:arrived` | `{ message, ride }` | Captain at pickup |
| `ride:started` | `{ message, ride }` | Ride started |
| `ride:completed` | `{ message, ride }` | Ride finished |
| `ride:cancelled` | `{ message, ride }` | Ride cancelled |
| `rider:location` | `{ riderId, lat, lng, timestamp }` | Captain's live location |

### Rider Receives These Events:

| Event | Data | Description |
|-------|------|-------------|
| `ride:new_request` | `{ message, ride }` | New instant ride available |
| `ride:assigned` | `{ message, ride }` | Admin assigned scheduled ride |
| `ride:user_cancelled` | `{ message, ride }` | User cancelled |
| `ride:completed` | `{ message, ride }` | Ride finished |

### Rider Emits These Events:

| Event | Data | Description |
|-------|------|-------------|
| `rider:online` | none | Mark captain online |
| `rider:offline` | none | Mark captain offline |
| `location:update` | `{ lat, lng, rideId? }` | Send GPS location |
| `ride:join` | `rideId` | Join ride room |
| `ride:leave` | `rideId` | Leave ride room |

---

## Pricing Structure

### Formula:
```
TOTAL_FARE = baseFare + (pricePerKm × distanceKm)

riderEarnings = TOTAL_FARE × (riderPercentage / 100)
appCommission = TOTAL_FARE × (appCommission / 100)
```

### Example:
| Parameter | Value |
|-----------|-------|
| Base Fare | ₹20 |
| Price per KM (CAR) | ₹15 |
| Distance | 10 km |
| Rider % | 80% |

**Result:**  
- Total = ₹20 + (₹15 × 10) = **₹170**
- Rider = ₹136
- App = ₹34

---

## Ride Status Flow

```
INSTANT BOOKING:
PENDING → ACCEPTED → ARRIVED → STARTED → COMPLETED
    ↓                                        
CANCELLED (user can cancel before COMPLETED)

SCHEDULED BOOKING:
SCHEDULED → ACCEPTED (admin assigns) → ARRIVED → STARTED → COMPLETED
    ↓
CANCELLED
```

### Status Definitions:

| Status | Description |
|--------|-------------|
| `PENDING` | Waiting for captain to accept (instant) |
| `SCHEDULED` | **NEW** - Waiting for admin to assign captain |
| `ACCEPTED` | Captain assigned/accepted |
| `ARRIVED` | Captain at pickup location |
| `STARTED` | Ride in progress |
| `COMPLETED` | Ride finished successfully |
| `CANCELLED` | Ride cancelled |

---

## New Ride Object Fields

```typescript
interface Ride {
  id: string;
  status: RideStatus;
  
  // NEW fields
  isManualBooking: boolean;       // true for scheduled rides
  scheduledDateTime?: string;     // ISO date for scheduled rides
  assignedByAdminId?: string;     // Admin who assigned
  bookingNotes?: string;          // User's booking notes
  
  // Pricing (baseFare is NEW)
  baseFare: number;
  perKmPrice: number;
  totalFare: number;
  riderEarnings: number;
  commission: number;
  
  // Locations
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropLat: number;
  dropLng: number;
  dropAddress: string;
  distanceKm: number;
  
  // Relations
  user?: User;
  rider?: Rider;
  vehicleType?: VehicleType;
}
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description here"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (wrong role)
- `404` - Not Found

---

## Quick Start Checklist

### For User App:
- [ ] Add Socket.IO client
- [ ] Connect socket with JWT on login
- [ ] Listen to user socket events
- [ ] Add "Book for Later" UI that calls `/api/user/rides/manual`
- [ ] Handle `SCHEDULED` status in ride list
- [ ] Show `scheduledDateTime` for scheduled rides

### For Captain App:
- [ ] Emit `rider:online`/`rider:offline` on toggle
- [ ] Listen for `ride:assigned` event
- [ ] Emit `location:update` during active ride
- [ ] Handle rides with `isManualBooking: true`

### For Admin Panel:
- [ ] New page for scheduled rides (`/api/admin/rides/scheduled`)
- [ ] Rider selection dropdown (`/api/admin/riders`)
- [ ] Assign rider button (`POST /api/admin/rides/:id/assign-rider`)
- [ ] Update pricing form with `baseFare` field
