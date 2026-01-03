# VOGY Backend - Complete API Documentation

> **Last Updated:** January 3, 2026  
> **Version:** 2.0 - Customer & Captain APIs

---

## Table of Contents
1. [Base URL & Authentication](#base-url--authentication)
2. [Authentication APIs](#authentication-apis)
3. [Customer APIs](#customer-apis)
4. [Captain APIs](#captain-apis)
5. [Public APIs](#public-apis)
6. [Socket.IO Integration](#socketio-integration)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)

---

## Base URL & Authentication

### Base URL
```
http://your-server-url/api
```

### Authentication Header
All protected endpoints require JWT token:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication APIs

> **Base URL:** `/api/auth`

### 1. Register Customer (User)

```http
POST /api/auth/register-user
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com",
  "profileImage": "https://example.com/image.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | Full name |
| `phone` | string | ✅ Yes | Phone with country code |
| `email` | string | ❌ No | Email address |
| `profileImage` | string | ❌ No | Profile image URL |

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_object_id",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "profileImage": null,
    "uniqueOtp": "1234",
    "createdAt": "2026-01-03T10:00:00.000Z"
  }
}
```

---

### 2. Register Captain (Rider)

```http
POST /api/auth/register-rider
```

**Request Body:**
```json
{
  "name": "Captain Name",
  "phone": "+919876543210",
  "vehicleTypeId": "vehicle_type_object_id",
  "email": "captain@example.com",
  "profileImage": "https://example.com/image.jpg",
  "aadharNumber": "1234-5678-9012",
  "licenseNumber": "DL-1234567890",
  "licenseImage": "https://example.com/license.jpg",
  "vehicleNumber": "KA01AB1234",
  "vehicleModel": "Honda City"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | Full name |
| `phone` | string | ✅ Yes | Phone with country code |
| `vehicleTypeId` | string | ✅ Yes | Vehicle type/sub-type ObjectId (e.g., SEDAN, SUV) |
| `email` | string | ❌ No | Email address |
| `profileImage` | string | ❌ No | Profile image URL |
| `aadharNumber` | string | ❌ No | Aadhaar card number |
| `licenseNumber` | string | ❌ No | Driving license number |
| `licenseImage` | string | ❌ No | License image URL |
| `vehicleNumber` | string | ❌ No | Vehicle registration number |
| `vehicleModel` | string | ❌ No | Vehicle model name |

**Response (201):**
```json
{
  "success": true,
  "message": "Rider registered successfully",
  "data": {
    "id": "rider_object_id",
    "name": "Captain Name",
    "phone": "+919876543210",
    "email": "captain@example.com",
    "vehicleNumber": "KA01AB1234",
    "vehicleModel": "Honda City",
    "isOnline": false,
    "rating": 5,
    "totalEarnings": 0,
    "vehicleType": {
      "id": "vehicle_type_id",
      "category": "CAR",
      "name": "SEDAN",
      "displayName": "Sedan"
    }
  }
}
```

---

### 3. Send OTP (Login Step 1)

```http
POST /api/auth/send-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "role": "USER"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `phone` | string | ✅ Yes | Phone with country code |
| `role` | string | ✅ Yes | `"USER"` or `"RIDER"` |

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "message": "OTP sent successfully"
  }
}
```

---

### 4. Verify OTP (Login Step 2)

```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "role": "USER",
  "code": "123456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | ✅ Yes | Phone with country code |
| `role` | string | ✅ Yes | `"USER"` or `"RIDER"` |
| `code` | string | ✅ Yes | 6-digit OTP received via SMS |

**Response (200) - For USER:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_object_id",
      "name": "John Doe",
      "phone": "+919876543210",
      "email": "john@example.com",
      "profileImage": null,
      "uniqueOtp": "1234"
    }
  }
}
```

**Response (200) - For RIDER:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "rider_object_id",
      "name": "Captain Name",
      "phone": "+919876543210",
      "vehicleNumber": "KA01AB1234",
      "vehicleModel": "Honda Activa",
      "isOnline": false,
      "rating": 5,
      "totalEarnings": 15000
    }
  }
}
```

---

## Customer APIs

> **Base URL:** `/api/user`  
> **Authentication:** Required (USER role)

### Profile Management

#### 1. Get Profile

```http
GET /api/user/profile
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "user_object_id",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "profileImage": "https://example.com/image.jpg",
    "uniqueOtp": "1234",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-03T10:00:00.000Z"
  }
}
```

---

#### 2. Update Profile

```http
PUT /api/user/profile
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.new@example.com",
  "profileImage": "https://example.com/new-image.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ❌ No | New name |
| `email` | string | ❌ No | New email |
| `profileImage` | string | ❌ No | New profile image URL |

> **Note:** At least one field is required.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_object_id",
    "name": "John Updated",
    "phone": "+919876543210",
    "email": "john.new@example.com",
    "profileImage": "https://example.com/new-image.jpg"
  }
}
```

---

#### 3. Get Unique OTP (For Ride Verification)

```http
GET /api/user/unique-otp
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Unique OTP retrieved successfully",
  "data": {
    "uniqueOtp": "1234"
  }
}
```

---

#### 4. Regenerate Unique OTP

```http
POST /api/user/unique-otp/regenerate
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Unique OTP updated successfully",
  "data": {
    "uniqueOtp": "5678"
  }
}
```

---

### Ride Management

> **Base URL:** `/api/user/rides`

#### 5. Create Instant Ride

```http
POST /api/user/rides/new-ride
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vehicleTypeId": "vehicle_type_object_id",
  "pickupLat": 12.9716,
  "pickupLng": 77.5946,
  "pickupAddress": "MG Road, Bangalore",
  "dropLat": 12.9352,
  "dropLng": 77.6245,
  "dropAddress": "Koramangala, Bangalore",
  "distanceKm": 8.5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicleTypeId` | string | ✅ Yes | Vehicle type ObjectId |
| `pickupLat` | number | ✅ Yes | Pickup latitude |
| `pickupLng` | number | ✅ Yes | Pickup longitude |
| `pickupAddress` | string | ✅ Yes | Pickup address text |
| `dropLat` | number | ✅ Yes | Drop latitude |
| `dropLng` | number | ✅ Yes | Drop longitude |
| `dropAddress` | string | ✅ Yes | Drop address text |
| `distanceKm` | number | ✅ Yes | Distance in kilometers |

**Response (201):**
```json
{
  "success": true,
  "message": "Ride created successfully",
  "data": {
    "id": "ride_object_id",
    "status": "PENDING",
    "isManualBooking": false,
    "pickupLat": 12.9716,
    "pickupLng": 77.5946,
    "pickupAddress": "MG Road, Bangalore",
    "dropLat": 12.9352,
    "dropLng": 77.6245,
    "dropAddress": "Koramangala, Bangalore",
    "distanceKm": 8.5,
    "baseFare": 20,
    "perKmPrice": 15,
    "totalFare": 147.5,
    "riderEarnings": 118,
    "commission": 29.5,
    "vehicleType": {
      "id": "vehicle_type_id",
      "name": "CAR",
      "displayName": "Car",
      "pricePerKm": 15
    },
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phone": "+919876543210",
      "uniqueOtp": "1234"
    },
    "createdAt": "2026-01-03T10:00:00.000Z"
  }
}
```

---

#### 6. Create Scheduled/Manual Ride

```http
POST /api/user/rides/manual
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vehicleTypeId": "vehicle_type_object_id",
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
| `vehicleTypeId` | string | ✅ Yes | Vehicle type ObjectId |
| `pickupLat` | number | ✅ Yes | Pickup latitude |
| `pickupLng` | number | ✅ Yes | Pickup longitude |
| `pickupAddress` | string | ✅ Yes | Pickup address text |
| `dropLat` | number | ✅ Yes | Drop latitude |
| `dropLng` | number | ✅ Yes | Drop longitude |
| `dropAddress` | string | ✅ Yes | Drop address text |
| `distanceKm` | number | ✅ Yes | Distance in kilometers |
| `scheduledDateTime` | string | ✅ Yes | ISO 8601 date (must be future) |
| `bookingNotes` | string | ❌ No | Optional notes for captain |

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
    "..."
  }
}
```

---

#### 7. Get All User Rides

```http
GET /api/user/rides/all-rides?status=COMPLETED
Authorization: Bearer <user_token>
```

**Query Parameters:**
| Param | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | ❌ No | `PENDING`, `SCHEDULED`, `ACCEPTED`, `ARRIVED`, `STARTED`, `COMPLETED`, `CANCELLED` |

**Response (200):**
```json
{
  "success": true,
  "message": "Rides retrieved successfully",
  "data": [
    {
      "id": "ride_id",
      "status": "COMPLETED",
      "pickupAddress": "MG Road, Bangalore",
      "dropAddress": "Koramangala, Bangalore",
      "totalFare": 147.5,
      "distanceKm": 8.5,
      "vehicleType": {
        "name": "CAR",
        "displayName": "Car"
      },
      "rider": {
        "id": "rider_id",
        "name": "Captain Name",
        "phone": "+91..."
      },
      "createdAt": "2026-01-03T10:00:00.000Z"
    }
  ]
}
```

---

#### 8. Get Ride by ID

```http
GET /api/user/rides/rideby/:id
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ride retrieved successfully",
  "data": {
    "id": "ride_id",
    "status": "ACCEPTED",
    "pickupLat": 12.9716,
    "pickupLng": 77.5946,
    "pickupAddress": "MG Road, Bangalore",
    "dropLat": 12.9352,
    "dropLng": 77.6245,
    "dropAddress": "Koramangala, Bangalore",
    "distanceKm": 8.5,
    "baseFare": 20,
    "perKmPrice": 15,
    "totalFare": 147.5,
    "vehicleType": { "..." },
    "rider": {
      "id": "rider_id",
      "name": "Captain Name",
      "phone": "+919876543210",
      "vehicleNumber": "KA01AB1234",
      "vehicleModel": "Honda Activa",
      "rating": 4.8
    }
  }
}
```

---

#### 9. Cancel Ride

```http
POST /api/user/rides/:id/cancel
Authorization: Bearer <user_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ride cancelled successfully",
  "data": {
    "id": "ride_id",
    "status": "CANCELLED"
  }
}
```

---

#### 10. Complete Ride with OTP

```http
POST /api/user/rides/:id/complete
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userOtp": "1234"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userOtp` | string | ✅ Yes | User's unique 4-digit OTP |

**Response (200):**
```json
{
  "success": true,
  "message": "Ride completed successfully",
  "data": {
    "id": "ride_id",
    "status": "COMPLETED",
    "endTime": "2026-01-03T11:00:00.000Z",
    "totalFare": 147.5,
    "riderEarnings": 118
  }
}
```

---

## Captain APIs

> **Base URL:** `/api/rider/rides`  
> **Authentication:** Required (RIDER role)

### Status & Location Management

#### 1. Toggle Online/Offline Status

```http
POST /api/rider/rides/online-status
Authorization: Bearer <rider_token>
Content-Type: application/json
```

**Request Body (Going Online):**
```json
{
  "isOnline": true,
  "lat": 12.9716,
  "lng": 77.5946
}
```

**Request Body (Going Offline):**
```json
{
  "isOnline": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isOnline` | boolean | ✅ Yes | Online status |
| `lat` | number | ✅ If online | Current latitude |
| `lng` | number | ✅ If online | Current longitude |

**Response (200):**
```json
{
  "success": true,
  "message": "You are now online",
  "data": {
    "id": "rider_id",
    "name": "Captain Name",
    "isOnline": true,
    "currentLat": 12.9716,
    "currentLng": 77.5946,
    "vehicleType": {
      "id": "vehicle_type_id",
      "name": "BIKE",
      "displayName": "Bike"
    }
  }
}
```

---

#### 2. Update Location

```http
POST /api/rider/rides/location
Authorization: Bearer <rider_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "lat": 12.9720,
  "lng": 77.5950
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | number | ✅ Yes | Current latitude |
| `lng` | number | ✅ Yes | Current longitude |

**Response (200):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "id": "rider_id",
    "name": "Captain Name",
    "currentLat": 12.9720,
    "currentLng": 77.5950,
    "isOnline": true
  }
}
```

---

### Ride Management

#### 3. Get Available Rides

```http
GET /api/rider/rides/available?lat=12.97&lng=77.59&vehicleTypeId=abc123
Authorization: Bearer <rider_token>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | number | ✅ Yes | Captain's current latitude |
| `lng` | number | ✅ Yes | Captain's current longitude |
| `vehicleTypeId` | string | ❌ No | Filter by vehicle type |

**Response (200):**
```json
{
  "success": true,
  "message": "Available rides retrieved successfully",
  "data": [
    {
      "id": "ride_id",
      "status": "PENDING",
      "pickupLat": 12.9716,
      "pickupLng": 77.5946,
      "pickupAddress": "MG Road, Bangalore",
      "dropLat": 12.9352,
      "dropLng": 77.6245,
      "dropAddress": "Koramangala, Bangalore",
      "distanceKm": 8.5,
      "totalFare": 147.5,
      "riderEarnings": 118,
      "vehicleType": {
        "id": "vehicle_type_id",
        "name": "CAR",
        "displayName": "Car"
      },
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "phone": "+919876543210"
      },
      "createdAt": "2026-01-03T10:00:00.000Z"
    }
  ]
}
```

---

#### 4. Accept Ride

```http
POST /api/rider/rides/:id/accept
Authorization: Bearer <rider_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ride accepted successfully",
  "data": {
    "id": "ride_id",
    "status": "ACCEPTED",
    "acceptedAt": "2026-01-03T10:05:00.000Z",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phone": "+919876543210",
      "uniqueOtp": "1234"
    },
    "pickupAddress": "MG Road, Bangalore",
    "dropAddress": "Koramangala, Bangalore"
  }
}
```

---

#### 5. Get Captain's Rides

```http
GET /api/rider/rides?status=ACCEPTED
Authorization: Bearer <rider_token>
```

**Query Parameters:**
| Param | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | ❌ No | `PENDING`, `SCHEDULED`, `ACCEPTED`, `ARRIVED`, `STARTED`, `COMPLETED`, `CANCELLED` |

**Response (200):**
```json
{
  "success": true,
  "message": "Rides retrieved successfully",
  "data": [
    {
      "id": "ride_id",
      "status": "ACCEPTED",
      "pickupAddress": "MG Road, Bangalore",
      "dropAddress": "Koramangala, Bangalore",
      "totalFare": 147.5,
      "riderEarnings": 118,
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "phone": "+919876543210",
        "uniqueOtp": "1234"
      },
      "acceptedAt": "2026-01-03T10:05:00.000Z"
    }
  ]
}
```

---

#### 6. Update Ride Status (ARRIVED/STARTED)

```http
PATCH /api/rider/rides/:id/status
Authorization: Bearer <rider_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "ARRIVED"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | string | ✅ Yes | `"ARRIVED"` or `"STARTED"` |

**Response (200):**
```json
{
  "success": true,
  "message": "Ride status updated successfully",
  "data": {
    "id": "ride_id",
    "status": "ARRIVED",
    "arrivedAt": "2026-01-03T10:15:00.000Z"
  }
}
```

---

## Public APIs

> **Base URL:** `/api/rides`  
> **Authentication:** Not Required

### 1. Get Vehicle Types

```http
GET /api/rides/vehicle-types
```

**Response (200):**
```json
{
  "success": true,
  "message": "Vehicle types retrieved successfully",
  "data": [
    { "id": "abc123", "name": "BIKE", "displayName": "Bike", "pricePerKm": 8, "isActive": true },
    { "id": "def456", "name": "AUTO", "displayName": "Auto Rickshaw", "pricePerKm": 12, "isActive": true },
    { "id": "ghi789", "name": "CAR", "displayName": "Car", "pricePerKm": 15, "isActive": true },
    { "id": "jkl012", "name": "PREMIUM", "displayName": "Premium Car", "pricePerKm": 20, "isActive": true }
  ]
}
```

---

### 2. Get Fare Estimates

```http
GET /api/rides/fare-estimate?distanceKm=10&pickupLat=12.97&pickupLng=77.59&radiusKm=5
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `distanceKm` | number | ✅ Yes | Distance between pickup and drop |
| `pickupLat` | number | ❌ No | Pickup latitude (for filtering by nearby captains) |
| `pickupLng` | number | ❌ No | Pickup longitude (for filtering by nearby captains) |
| `radiusKm` | number | ❌ No | Search radius in km (default: 10km) |

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
```

---

### 3. Get Pricing Config

```http
GET /api/rides/pricing
```

**Response (200):**
```json
{
  "success": true,
  "message": "Pricing config retrieved successfully",
  "data": {
    "baseFare": 20,
    "riderPercentage": 80,
    "appCommission": 20
  }
}
```

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

### Events Customer Receives

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

### Events Captain Receives

| Event | Data | Description |
|-------|------|-------------|
| `ride:new_request` | `{ message, ride }` | New instant ride available |
| `ride:assigned` | `{ message, ride }` | Admin assigned scheduled ride |
| `ride:user_cancelled` | `{ message, ride }` | User cancelled |
| `ride:completed` | `{ message, ride }` | Ride finished |

### Events Captain Emits

| Event | Data | Description |
|-------|------|-------------|
| `rider:online` | none | Mark captain online |
| `rider:offline` | none | Mark captain offline |
| `location:update` | `{ lat, lng, rideId? }` | Send GPS location |
| `ride:join` | `rideId` | Join ride room |
| `ride:leave` | `rideId` | Leave ride room |

---

## Data Models

### User (Customer)
```typescript
interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
  uniqueOtp: string;    // 4-digit OTP for ride verification
  createdAt: string;
  updatedAt: string;
}
```

### Rider (Captain)
```typescript
interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
  aadharNumber?: string;
  licenseNumber?: string;
  licenseImage?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleTypeId?: string;
  vehicleType?: VehicleType;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  rating: number;         // Default: 5
  totalEarnings: number;  // Default: 0
  createdAt: string;
  updatedAt: string;
}
```

### Ride
```typescript
interface Ride {
  id: string;
  userId?: string;
  riderId?: string;
  vehicleTypeId?: string;
  
  status: RideStatus;
  
  // Locations
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropLat: number;
  dropLng: number;
  dropAddress: string;
  distanceKm: number;
  
  // Pricing
  baseFare?: number;
  perKmPrice?: number;
  totalFare?: number;
  riderEarnings?: number;
  commission?: number;
  
  // OTP verification
  userOtp?: string;
  
  // Timestamps
  startTime?: string;
  endTime?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Manual booking fields
  isManualBooking: boolean;
  scheduledDateTime?: string;
  assignedByAdminId?: string;
  bookingNotes?: string;
  
  // Relations
  user?: User;
  rider?: Rider;
  vehicleType?: VehicleType;
}
```

### RideStatus Enum
```typescript
enum RideStatus {
  PENDING = "PENDING",       // Waiting for captain to accept (instant)
  SCHEDULED = "SCHEDULED",   // Waiting for admin to assign captain
  ACCEPTED = "ACCEPTED",     // Captain assigned/accepted
  ARRIVED = "ARRIVED",       // Captain at pickup location
  STARTED = "STARTED",       // Ride in progress
  COMPLETED = "COMPLETED",   // Ride finished successfully
  CANCELLED = "CANCELLED"    // Ride cancelled
}
```

### VehicleType
```typescript
interface VehicleType {
  id: string;
  name: "AUTO" | "BIKE" | "CAR" | "PREMIUM";
  displayName: string;
  pricePerKm: number;
  isActive: boolean;
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description here"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid/missing token) |
| `403` | Forbidden (wrong role) |
| `404` | Not Found |
| `500` | Server Error |

### Common Error Messages

| Message | Cause |
|---------|-------|
| `"Unauthorized"` | Missing or invalid JWT token |
| `"User already exists"` | Phone number already registered |
| `"Rider already exists"` | Phone number already registered as captain |
| `"Phone number is not registered"` | Trying to login without registration |
| `"Invalid OTP"` | Wrong OTP code |
| `"OTP expired"` | OTP validity (5 minutes) expired |
| `"Ride not found"` | Invalid ride ID |
| `"Invalid user OTP"` | Wrong unique OTP for ride completion |

---

## Pricing Formula

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

---

## Quick Integration Checklist

### For Customer App:
- [ ] Implement registration with OTP verification
- [ ] Add profile management (get/update)
- [ ] Connect Socket.IO with JWT on login
- [ ] Get fare estimates before booking
- [ ] Create instant and scheduled rides
- [ ] Listen to ride status socket events
- [ ] Show captain location updates on map
- [ ] Handle ride completion with user OTP

### For Captain App:
- [ ] Implement registration with vehicle details
- [ ] Add online/offline toggle with location
- [ ] Get available rides for current location
- [ ] Accept ride functionality
- [ ] Update ride status (ARRIVED → STARTED)
- [ ] Emit location updates during active ride
- [ ] Listen for new ride requests via socket
- [ ] Handle assigned scheduled rides
