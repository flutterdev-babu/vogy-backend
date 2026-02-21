# Admin API & Frontend Integration Refinement Guide v2

This document outlines the major refinements made to the Admin APIs to support manual bookings, advanced attachment management, and improved entity filtering.

## 1. Manual Ride Booking (Admin)
Admins can now book rides manually for users (even if the user doesn't exist yet).

**Endpoint:** `POST /admin/rides/manual`
**Payload:**
```json
{
  "userPhone": "9876543210", 
  "userName": "John Doe", 
  "vehicleTypeId": "65d...",
  "pickupAddress": "123 Street, Bangalore",
  "pickupLat": 12.9716,
  "pickupLng": 77.5946,
  "dropAddress": "456 Avenue, Bangalore",
  "dropLat": 12.9352,
  "dropLng": 77.6245,
  "distanceKm": 15.5,
  "scheduledDateTime": "2024-03-25T10:30:00Z",
  "cityCodeId": "65c...",
  "rideType": "LOCAL",
  "paymentMode": "CASH"
}
```
**Refinements:**
- **Auto User Creation:** If `userPhone` is provided and the user doesn't exist, a new user account is automatically created.
- **Custom ID Generation:** Generates a unique `customId` like `ACRBLR0001` based on the city code.
- **Smart Fare Calculation:** Automatically uses city-specific pricing if available, else falls back to global configs.
- **Socket Notification:** Emits `ride:new_scheduled` to all admins and `ride:created` to the user.

---

## 2. Advanced Attachment Management
The attachment system now supports two distinct flows to allow for bulk linking and individual document updates.

**Endpoint:** `POST /admin/attachments`

### Flow A: 3-ID Link Registration Bundle
Used during initial onboarding to link Vendor, Partner, and Vehicle records.
**Payload:**
```json
{
  "vendorCustomId": "ACVBLR01",
  "partnerCustomId": "ACPBLR01",
  "vehicleCustomId": "ACVHBLR01",
  "cityCode": "BLR"
}
```

### Flow B: Polymorphic Individual Document Upload
Used for specific document types (e.g., Driver License, RC Book).
**Payload:**
```json
{
  "referenceType": "PARTNER", // VENDOR, PARTNER, VEHICLE
  "referenceId": "65c...", 
  "fileType": "DRIVING_LICENSE", 
  "fileUrl": "https://storage.com/doc.pdf",
  "uploadedBy": "ADMIN"
}
```

**Refinements:**
- **Custom ID:** Both flows generate a standard master attachment ID (e.g., `ACAABLR01`).
- **Filtering:** `GET /admin/attachments` now supports query params: `vendorId`, `partnerId`, `vehicleId`, `verificationStatus`.
- **Verification:** `PUT /admin/attachments/:id/verify` takes `{ "status": "VERIFIED" }`.

---

## 3. Improved Entity Filtering (Search by Custom ID)
All major list endpoints now support advanced filtering and secondary search by Custom ID.

### Partners (Riders)
**Endpoint:** `GET /admin/riders`
**Query Params:**
- `status`: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- `verificationStatus`: `VERIFIED`, `UNVERIFIED`, `PENDING`, `REJECTED`
- `search`: Searches by `name`, `phone`, `email`, or `customId` (e.g., `ACPBLR01`).
- `isOnline`: `true`/`false`

### Vendors
**Endpoint:** `GET /admin/vendors`
**Query Params:**
- `status`, `verificationStatus`
- `search`: Searches by `name`, `companyName`, `phone`, or `customId`.

### Rides
**Endpoint:** `GET /admin/rides`
**Query Params:**
- `status`, `vehicleType`, `userId`, `partnerId`
- `search`: Searches by `customId`, `user name`, or `partner name`.

---

## 4. Administrative Controls
- **Ride OTP:** `GET /admin/rides/:id/otp` returns the user's completion OTP for manual closure.
- **Partner Assignment:** `POST /admin/rides/:id/assign` takes `{ "partnerId": "..." }`.
- **Global Overview:** `GET /admin/dashboard` provides updated counts and revenue metadata.

## 5. Socket Event Summary
| Event | Target | Description |
|---|---|---|
| `ride:created` | User | Emitted on ride creation (Instant/Manual) |
| `ride:new_scheduled` | Admin | New manual ride awaiting assignment |
| `ride:partner_assigned` | User | Notifies user when a captain is assigned |
| `ride:assigned` | Partner | Notifies partner of new assignment |
| `ride:status_changed` | Admin | Global tracking of ride progress |
