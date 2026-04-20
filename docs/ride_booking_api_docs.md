# ARA Travels Ride Booking API & Socket Documentation

This document provides technical details for the Ride Booking flow, including REST API endpoints and real-time Socket.IO events for the User (Customer) application.

---

## 🚀 1. Ride Booking REST APIs

All User Ride APIs require a Bearer Token with the `USER` role.
**Base Path:** `/api/user/rides`

### A. Estimate Fare
Calculates estimated prices for all available vehicle types based on distance and city.
- **Endpoint:** `POST /estimate-fare`
- **Request Body:**
  ```json
  {
    "distanceKm": 12.5,
    "cityCodeId": "uuid-of-city",
    "couponCode": "ARA50" (optional),
    "rideType": "LOCAL" (optional, Enum: "AIRPORT" | "LOCAL" | "OUTSTATION" | "RENTAL")
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "distanceKm": 12.5,
      "vehicleOptions": [
        {
          "vehicleTypeId": "uuid",
          "category": "CAR",
          "name": "sedan",
          "displayName": "Sedan",
          "estimatedFare": 250.00,
          "finalFare": 200.00 (if coupon applied)
        }
      ]
    }
  }
  ```

### B. Create Instant Ride
Requests an immediate ride. This triggers a broadcast to nearby partners.
- **Endpoint:** `POST /new-ride`
- **Request Body:**
  ```json
  {
    "vehicleTypeId": "uuid",
    "pickupLat": 12.9716,
    "pickupLng": 77.5946,
    "pickupAddress": "123 Main St, Bangalore",
    "dropLat": 12.9279,
    "dropLng": 77.6271,
    "dropAddress": "456 Park Rd, Bangalore",
    "distanceKm": 12.5,
    "cityCodeId": "uuid",
    "paymentMode": "CASH" (default),
    "rideType": "LOCAL" (optional, Enum: "AIRPORT" | "LOCAL" | "OUTSTATION" | "RENTAL")
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Ride created successfully",
    "data": { "id": "uuid-of-ride", "customId": "ARA-R-001", "status": "UPCOMING", ... }
  }
  ```

### C. Get Ride Details
Retrieve current status and assigned partner information.
- **Endpoint:** `GET /rideby/:id`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "ASSIGNED",
      "partner": {
        "name": "John Doe",
        "phone": "+919876543210",
        "profileImage": "url",
        "rating": 4.8
      },
      "vehicle": {
        "registrationNumber": "KA01AB1234",
        "vehicleModel": "Toyota Glanza"
      }
    }
  }
  ```

---

## 🔌 2. Ride Booking Sockets (Live Updates)

The User app should connect to the Socket.IO server and listen for these events to provide a "Live" experience without polling.

### Initialization
1. **Connect**: Pass the JWT token in `auth`.
2. **Personal Room**: You automatically join `user_{userId}` on connection.
3. **Specific Ride Room**: Call `socket.emit("ride:join", rideId)` after booking to receive location updates.

### Events to Listen For (User App)

| Event Name | Recipient | When it triggers | Payload Content |
| :--- | :--- | :--- | :--- |
| `ride:created` | User | Immediately after API call success | The full Ride object |
| `ride:accepted` | User | When a partner clicks "Accept" | Updated Ride + **Partner Info** |
| `ride:partner_assigned` | User | When an Admin/Agent assigns a partner | Updated Ride + **Partner Info** |
| `ride:arrived` | User | When partner arrives at pickup | Status "ARRIVED" |
| `ride:started` | User | When trip starts (OTP verified) | Status "STARTED" |
| `partner:location` | User (in ride room) | Every few seconds while active | `{ lat, lng, partnerId }` |
| `ride:completed` | User | When trip ends | Final Ride object |
| `ride:cancelled` | User | When partner cancels ride | Reason + Ride object |

### Example Payload: `ride:accepted`
```json
{
  "message": "A captain has accepted your ride",
  "ride": {
    "id": "uuid",
    "status": "ASSIGNED",
    "partner": {
      "name": "Rahul Kumar",
      "phone": "+91XXXXXXXXXX",
      "rating": 4.9
    },
    "vehicle": {
      "registrationNumber": "DL10XY1234",
      "vehicleModel": "Honda Activa"
    }
  }
}
```

---

## 🛠 3. Implementation Checklist for Frontend
1. **Step 1:** Call `/estimate-fare` to show vehicle options.
2. **Step 2:** Call `/new-ride` and listen for `ride:created` (via Sockets) or use the API response.
3. **Step 3:** Stay on "Searching" screen until `ride:accepted` or `ride:partner_assigned` is received via Sockets.
4. **Step 4:** Once assigned, join the ride room: `socket.emit("ride:join", rideId)`.
5. **Step 5:** Listen for `partner:location` to move the vehicle icon on the map.
6. **Step 6:** Handle `ride:arrived`, `ride:started`, and `ride:completed` to update UI state automatically.
