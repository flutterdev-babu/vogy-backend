# Frontend Guide: Custom IDs & Ride Identification

This document outlines the changes to the backend API regarding `customId` fields and the new requirement for creating rides.

## 1. Custom ID Formats

All major entities now return a human-readable `customId` in addition to their database `id`.

| Entity | Format Example | Description |
| :--- | :--- | :--- |
| **Agent** | `ICABLR01` | IC + A + CityCode + 2-digit Serial |
| **Vendor** | `ICVBLR01` | IC + V + CityCode + 2-digit Serial |
| **Corporate** | `ICCBLR01` | IC + C + CityCode + 2-digit Serial |
| **Partner** | `ICPBLR01` | IC + P + CityCode + 2-digit Serial |
| **Vehicle** | `ICVHBLR01` | IC + VH + CityCode + 2-digit Serial |
| **Ride** | `ICRBLR0001` | IC + R + CityCode + **4-digit Serial** |

## 2. Updated API Responses

All list and detail endpoints for the above entities now include the `customId` field in the response objects.

### Example Ride Response
```json
{
  "id": "65c1...",
  "customId": "ICRBLR0001",
  "status": "PENDING",
  "pickupAddress": "...",
  "vendor": {
    "id": "...",
    "customId": "ICVBLR01",
    "companyName": "..."
  },
  "partner": {
    "id": "...",
    "customId": "ICPBLR01",
    "name": "..."
  }
}
```

## 3. Important: New Required Field for Ride Creation

When creating a ride (Instant or Manual), the frontend MUST now provide a `cityCodeId`. This is required to generate the correct `customId` for the ride.

### POST `/api/rides` (Instant Booking)
**Required Body:**
```json
{
  "vehicleTypeId": "...",
  "pickupLat": 12.9716,
  "pickupLng": 77.5946,
  "pickupAddress": "...",
  "dropLat": 12.9250,
  "dropLng": 77.5898,
  "dropAddress": "...",
  "distanceKm": 10.5,
  "cityCodeId": "..." // NEW REQUIRED FIELD
}
```

### POST `/api/rides/manual` (Scheduled Booking)
**Required Body:**
```json
{
  ...
  "scheduledDateTime": "2024-02-10T10:00:00Z",
  "cityCodeId": "..." // NEW REQUIRED FIELD
}
```

### POST `/api/agent/ride/manual` (Agent Manual Booking)
**Required Body:**
```json
{
  ...
  "cityCodeId": "..." // NEW REQUIRED FIELD
}
```

## 4. How to get `cityCodeId`?

You can fetch the list of available city codes from the existing endpoint:
**GET `/api/city/codes`**

Ensure that the user selects a city before or during the ride booking process.
