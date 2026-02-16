# Dashboard APIs — Frontend Integration Guide

> **Base URL**: `/api`  
> **Auth**: All endpoints require `Authorization: Bearer <token>` header  
> **Response format**: `{ success: boolean, data: <response>, message?: string }`

---

## 1. Vendor Dashboard APIs

> Role: `VENDOR` — Token obtained via `/api/vendors/auth/login`

### GET `/api/vendors/dashboard`
Returns aggregated vendor statistics.

```json
{
  "vehicles": { "total": 12, "available": 8, "inUse": 4 },
  "partners": { "total": 6, "online": 3, "offline": 3 },
  "rides": { "total": 450, "completed": 400, "cancelled": 20, "active": 5, "today": 12 },
  "revenue": { "total": 125000, "earnings": 100000, "commission": 25000, "today": 5400 }
}
```

### GET `/api/vendors/attachments`
Returns all vendor-partner-vehicle attachments.

```json
[
  {
    "id": "...",
    "vendorId": "...",
    "partner": { "id": "...", "customId": "PTN-BLR-001", "name": "John", "phone": "9876543210", "status": "APPROVED", "isOnline": true },
    "vehicle": {
      "id": "...", "customId": "VEH-BLR-001", "registrationNumber": "KA01AB1234",
      "vehicleModel": "Swift Dzire", "isAvailable": true,
      "vehicleType": { "id": "...", "name": "sedan", "displayName": "Sedan", "category": "FOUR_WHEELER" }
    },
    "createdAt": "2026-02-10T..."
  }
]
```

### GET `/api/vendors/rides/:id`
Returns a specific ride detail scoped to this vendor.

```json
{
  "id": "...", "customId": "RD-BLR-045", "status": "COMPLETED",
  "pickupAddress": "MG Road", "dropAddress": "Electronic City",
  "totalFare": 450, "riderEarnings": 360, "commission": 90,
  "partner": { "id": "...", "customId": "PTN-BLR-001", "name": "John", "rating": 4.8 },
  "vehicle": { "registrationNumber": "KA01AB1234", "vehicleModel": "Swift Dzire" },
  "vehicleType": { "displayName": "Sedan", "category": "FOUR_WHEELER" },
  "user": { "name": "Customer A", "phone": "9876543210" }
}
```

### GET `/api/vendors/earnings`
Revenue breakdown with daily trend (last 30 days) and payment mode distribution.

```json
{
  "total": { "revenue": 125000, "partnerEarnings": 100000, "commission": 25000, "completedRides": 400 },
  "byPaymentMode": [
    { "mode": "CASH", "count": 250, "amount": 75000 },
    { "mode": "ONLINE", "count": 150, "amount": 50000 }
  ],
  "dailyBreakdown": [
    { "date": "2026-02-10", "revenue": 5400, "rides": 12 },
    { "date": "2026-02-09", "revenue": 4800, "rides": 10 }
  ]
}
```

---

## 2. Partner Dashboard APIs

> Role: `PARTNER` — Token obtained via `/api/partners/auth/login`

### GET `/api/partners/dashboard`
Returns partner's aggregated dashboard data.

```json
{
  "status": { "isOnline": true, "rating": 4.8 },
  "rides": { "total": 120, "completed": 100, "cancelled": 5, "active": 1, "today": 4, "completionRate": "83.33" },
  "earnings": { "total": 45000, "sessionEarnings": 42000, "totalFare": 52500, "todayEarnings": 1800, "todayFare": 2250 },
  "assignedVehicle": {
    "id": "...", "customId": "VEH-BLR-001", "registrationNumber": "KA01AB1234",
    "vehicleModel": "Swift Dzire",
    "vehicleType": { "displayName": "Sedan", "category": "FOUR_WHEELER" }
  }
}
```

### GET `/api/partners/vehicle`
Returns partner's assigned vehicle details including vendor info.

```json
{
  "hasOwnVehicle": false,
  "ownVehicle": null,
  "assignedVehicle": {
    "id": "...", "registrationNumber": "KA01AB1234", "vehicleModel": "Swift Dzire",
    "vendor": { "id": "...", "customId": "VND-BLR-001", "name": "ABC Fleet", "companyName": "ABC Transport", "phone": "9876543210" },
    "vehicleType": { "displayName": "Sedan", "category": "FOUR_WHEELER", "pricePerKm": 12 }
  }
}
```

### GET `/api/partners/rides/:id`
Returns a specific ride detail scoped to this partner.

### GET `/api/partners/earnings`
Earnings breakdown with daily trend (last 30 days).

```json
{
  "total": { "earnings": 42000, "totalFare": 52500, "completedRides": 100 },
  "byPaymentMode": [
    { "mode": "CASH", "count": 60, "earnings": 25200 },
    { "mode": "ONLINE", "count": 40, "earnings": 16800 }
  ],
  "dailyBreakdown": [
    { "date": "2026-02-10", "earnings": 1800, "rides": 4 }
  ]
}
```

---

## 3. Admin Dashboard APIs

> Role: `ADMIN` — Token obtained via `/api/admin/auth/login`

### GET `/api/admin/dashboard`
Global overview stats for the admin panel.

```json
{
  "entities": { "users": 500, "vendors": 20, "partners": 60, "vehicles": 80, "agents": 5, "corporates": 10, "onlinePartners": 25 },
  "rides": { "total": 3000, "completed": 2500, "active": 30, "today": 45 },
  "revenue": { "total": 750000, "partnerEarnings": 600000, "commission": 150000, "todayRevenue": 12000, "todayCommission": 3000 },
  "todayNewUsers": 8
}
```

### GET `/api/admin/analytics/revenue`
Revenue analytics with payment mode breakdown and 30-day daily trend.

```json
{
  "byPaymentMode": [
    { "mode": "CASH", "count": 1500, "revenue": 450000, "commission": 90000 },
    { "mode": "ONLINE", "count": 1000, "revenue": 300000, "commission": 60000 }
  ],
  "dailyRevenue": [
    { "date": "2026-02-10", "revenue": 12000, "commission": 3000, "rides": 45 }
  ]
}
```

### GET `/api/admin/analytics/rides`
Ride analytics with status distribution, vehicle type breakdown, and booking type.

```json
{
  "statusDistribution": [
    { "status": "COMPLETED", "count": 2500 },
    { "status": "CANCELLED", "count": 200 },
    { "status": "UPCOMING", "count": 50 }
  ],
  "byVehicleType": [
    { "vehicleTypeId": "...", "vehicleType": { "displayName": "Sedan", "category": "FOUR_WHEELER" }, "count": 1200, "revenue": 360000 }
  ],
  "bookingType": { "manual": 300, "app": 2700 }
}
```

### GET `/api/admin/analytics/entities`
Entity status distribution for vendors, partners, and corporates.

```json
{
  "vendors": [
    { "status": "APPROVED", "count": 15 },
    { "status": "PENDING", "count": 3 },
    { "status": "SUSPENDED", "count": 2 }
  ],
  "partners": [
    { "status": "APPROVED", "count": 50 },
    { "status": "PENDING", "count": 8 },
    { "status": "SUSPENDED", "count": 2 }
  ],
  "corporates": [
    { "status": "ACTIVE", "count": 8 },
    { "status": "PENDING", "count": 2 }
  ]
}
```

### GET `/api/admin/recent-activity?limit=20`
Recent activity feed across all entity types.

| Query Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Max items per section |

```json
{
  "recentRides": [{ "id": "...", "customId": "RD-BLR-045", "status": "COMPLETED", "totalFare": 450, "createdAt": "...", "user": { "name": "..." }, "partner": { "name": "..." } }],
  "recentVendors": [{ "id": "...", "customId": "VND-BLR-001", "name": "...", "companyName": "...", "status": "PENDING", "createdAt": "..." }],
  "recentPartners": [{ "id": "...", "customId": "PTN-BLR-001", "name": "...", "status": "APPROVED", "createdAt": "..." }],
  "recentUsers": [{ "id": "...", "name": "...", "phone": "...", "createdAt": "..." }]
}
```

---

## 4. User App APIs

> Role: `USER` — Token obtained via `/api/auth/verify-otp`

### GET `/api/user/rides/summary`
User's ride history statistics.

```json
{
  "totalRides": 25,
  "completedRides": 22,
  "cancelledRides": 2,
  "inProgress": 1,
  "totalSpent": 8500,
  "averageFare": 386.36
}
```

### GET `/api/user/rides/active`
Returns the user's currently active ride (if any), or `null`.

```json
{
  "id": "...", "customId": "RD-BLR-045", "status": "STARTED",
  "pickupAddress": "MG Road", "dropAddress": "Electronic City",
  "totalFare": 450,
  "partner": {
    "id": "...", "customId": "PTN-BLR-001", "name": "John", "phone": "9876543210",
    "profileImage": "...", "rating": 4.8, "currentLat": 12.9716, "currentLng": 77.5946, "isOnline": true
  },
  "vehicle": { "registrationNumber": "KA01AB1234", "vehicleModel": "Swift Dzire" },
  "vehicleType": { "displayName": "Sedan", "category": "FOUR_WHEELER" }
}
```

### GET `/api/user/spend-summary`
User spending breakdown by payment mode, vehicle type, and daily (last 30 days).

```json
{
  "byPaymentMode": [
    { "mode": "CASH", "count": 15, "amount": 5100 },
    { "mode": "ONLINE", "count": 7, "amount": 3400 }
  ],
  "byVehicleType": [
    { "vehicleTypeId": "...", "vehicleType": { "displayName": "Sedan", "category": "FOUR_WHEELER" }, "count": 18, "amount": 6800 }
  ],
  "dailySpend": [
    { "date": "2026-02-10", "spent": 450, "rides": 1 }
  ]
}
```

---

## Quick Reference

| Role | Endpoint | Description |
|---|---|---|
| **Vendor** | `GET /api/vendors/dashboard` | Overview stats |
| **Vendor** | `GET /api/vendors/attachments` | Partner-vehicle links |
| **Vendor** | `GET /api/vendors/rides/:id` | Ride detail |
| **Vendor** | `GET /api/vendors/earnings` | Revenue breakdown |
| **Partner** | `GET /api/partners/dashboard` | Overview stats |
| **Partner** | `GET /api/partners/vehicle` | Assigned vehicle info |
| **Partner** | `GET /api/partners/rides/:id` | Ride detail |
| **Partner** | `GET /api/partners/earnings` | Earnings breakdown |
| **Admin** | `GET /api/admin/dashboard` | Global overview |
| **Admin** | `GET /api/admin/analytics/revenue` | Revenue analytics |
| **Admin** | `GET /api/admin/analytics/rides` | Ride analytics |
| **Admin** | `GET /api/admin/analytics/entities` | Entity statuses |
| **Admin** | `GET /api/admin/recent-activity` | Activity feed |
| **User** | `GET /api/user/rides/summary` | Ride history stats |
| **User** | `GET /api/user/rides/active` | Active ride |
| **User** | `GET /api/user/spend-summary` | Spending analytics |
