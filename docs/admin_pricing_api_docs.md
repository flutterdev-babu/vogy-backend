# Admin Vehicle Pricing Groups API

This document covers the Admin APIs for creating and managing service-based pricing groups (Airport, Local, Rental, Outstation) for vehicles across various cities.

All Admin endpoints require a Bearer Token with the `ADMIN` role.
**Base Path:** `/api/admin/vehicle-pricing-groups`

---

## 1. Create a Pricing Group
Creates a new pricing configuration for a specific vehicle type, city combination, and service type.

- **Endpoint:** `POST /api/admin/vehicle-pricing-groups`
- **Request Body:**
  ```json
  {
    "vehicleTypeId": "uuid-of-vehicle-type",
    "name": "Sedan Airport Pricing Bangalore",
    "serviceType": "AIRPORT", // Optional, Enum: "AIRPORT" | "LOCAL" | "OUTSTATION" | "RENTAL". Defaults to "LOCAL".
    "baseKm": 2,              // Base distance included in base fare
    "baseFare": 100,          // Flat fare up to baseKm
    "perKmPrice": 15,         // Price per additional km
    "cityCodeIds": [
      "uuid-of-city-code"     // Appies to these cities
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Vehicle pricing group created successfully",
    "data": {
      "id": "uuid-of-pricing-group",
      "vehicleTypeId": "uuid",
      "name": "Sedan Airport Pricing Bangalore",
      "serviceType": "AIRPORT",
      "baseKm": 2,
      "baseFare": 100,
      "perKmPrice": 15,
      "cityCodeIds": ["uuid"],
      "isActive": true
    }
  }
  ```

---

## 2. Get All Pricing Groups
Retrieve all pricing groups. You can filter by `vehicleTypeId` and `serviceType`.

- **Endpoint:** `GET /api/admin/vehicle-pricing-groups`
- **Query Parameters (Optional):**
  - `?vehicleTypeId=uuid`
  - `?serviceType=AIRPORT`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "vehicleTypeId": "uuid",
        "name": "Sedan Airport Pricing Bangalore",
        "serviceType": "AIRPORT",
        "baseKm": 2,
        "baseFare": 100,
        "perKmPrice": 15,
        "cityCodeIds": ["uuid"],
        "isActive": true,
        "vehicleType": {
           // Vehicle type details...
        }
      }
    ]
  }
  ```

---

## 3. Update a Pricing Group
Update the details or pricing properties of an existing group.

- **Endpoint:** `PUT /api/admin/vehicle-pricing-groups/:id`
- **Request Body (All fields are optional):**
  ```json
  {
    "name": "Updated Sedan Airport Pricing",
    "serviceType": "AIRPORT", 
    "baseKm": 5,              
    "baseFare": 250,          
    "perKmPrice": 12,         
    "cityCodeIds": ["uuid"],
    "isActive": true
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Vehicle pricing group updated successfully",
    "data": {
      "id": "uuid",
      "vehicleTypeId": "uuid",
      "name": "Updated Sedan Airport Pricing",
      "serviceType": "AIRPORT",
      "baseKm": 5,
      ...
    }
  }
  ```

---

## 4. Delete a Pricing Group
Removes a pricing group entirely.

- **Endpoint:** `DELETE /api/admin/vehicle-pricing-groups/:id`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Pricing group deleted successfully"
  }
  ```
