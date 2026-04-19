# Testing User Login APIs with Postman

The User Login process in ARA Travels is a two-step OTP-based flow. Follow these steps to test it in Postman.

---

## 🛠 Prerequisites
- **Base URL**: `http://localhost:5000` (or your server URL)
- **Role**: `USER` (Required for all user-facing auth APIs)

---

## 1. Register User (One-time)
If your phone number is not registered, you must register first.
- **Method**: `POST`
- **URL**: `/api/auth/register-user`
- **Body (JSON)**:
  ```json
  {
    "name": "Jane Doe",
    "phone": "+919876543210",
    "email": "jane@example.com"
  }
  ```
- **Response**: `201 Created`

---

## 2. Step 1: Request OTP
Enter your phone number to receive a 6-digit login code.
- **Method**: `POST`
- **URL**: `/api/auth/send-otp`
- **Body (JSON)**:
  ```json
  {
    "phone": "+919876543210",
    "role": "USER"
  }
  ```
- **Response**: `200 OK`
> [!NOTE]
> If you don't receive the SMS via Twilio, you can check the **Server Logs/Console** where the generated OTP is usually visible for debugging.

---

## 3. Step 2: Verify OTP & Get Token
Use the 6-digit code from the previous step to log in.
- **Method**: `POST`
- **URL**: `/api/auth/verify-otp`
- **Body (JSON)**:
  ```json
  {
    "phone": "+919876543210",
    "role": "USER",
    "code": "XXXXXX" (The 6-digit code)
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1...",
      "user": { "id": "uuid", "name": "Jane Doe", ... }
    }
  }
  ```

---

## 4. How to use the Token in Other APIs
Once you have the `token` from Step 3:
1. In Postman, go to any Ride API (e.g., `GET /api/user/rides/all-rides`).
2. Go to the **Authorization** tab.
3. Select **Auth Type**: `Bearer Token`.
4. Paste the JWT token into the **Token** field.
5. Hit **Send**.
