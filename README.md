# SMARTPARK AI — Commercial Smart Parking Management System

An autonomous, full-stack, hardware-integrated Smart Parking platform developed with Node.js, Express, MongoDB (Mongoose), Vanilla JavaScript, CSS3, and ESP32 IoT barrier control.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       SmartPark Web Dashboard        |
                      |   (HTML5, Responsive CSS3, Vanilla JS)|
                      +-------------------+-------------------+
                                          | REST API / Fetch
                                          v
                      +---------------------------------------+
                      |       Node.js + Express API Server    |
                      |    (Port 5000, JWT Auth, I18N, IoT)   |
                      +---------+-------------------+---------+
                                |                   |
             +------------------+                   +------------------+
             v                                                         v
+------------------------+                                 +-----------------------+
|  MongoDB / Mongoose    |                                 | ESP32 IoT Nodes & Hub |
|  Dual-Mode Persistence |                                 |  - RC522 RFID Reader  |
|  (User, Locations,     |                                 |  - ANPR YOLO Cam      |
|   Slots, Bookings,     |                                 |  - SG90 Servo Barrier |
|   Sessions, Payments,  |                                 |  - HC-SR04 Ultrasonic |
|   Notifications)       |                                 +-----------------------+
+------------------------+
```

---

## 1. Key Features

- **Driver Authentication**: Full registration with 7 mandatory fields (`fullName`, `phone`, `password`, `confirmPassword`, `rfid`, `vehicleNumber`, `email`), bcrypt password hashing, duplicate conflict rejection, and JWT session handling.
- **Top-Right Toolbar**:
  - **Driver Profile**: Name, Email, RFID, Vehicle, Phone, secure password change modal, and session sign out.
  - **Multilingual (English & Tamil)**: Centralized translation dictionary (`js/i18n.js`) with immediate DOM translation across all views.
  - **Appearance Switch**: Light, Dark (navy/charcoal), and System mode reacting to device `prefers-color-scheme`.
  - **Real-Time Notifications**: Persistent in-app notifications with unread badge, category badges, mark all as read, and 8-second polling.
- **Driver Dashboard**:
  - Authoritative ticking countdown timer persisting on refresh.
  - Warnings at 10 minutes remaining and expiry alerts.
  - Recent booking history table with live status badges.
- **Book Slot Workflow**:
  - Parking facilities including **VS Mall Parking Complex**.
  - Interactive layout with standard status colors:
    - 🟢 **Green**: Free (Available)
    - 🟡 **Yellow**: Reserved
    - 🔴 **Red**: Booked or Occupied
    - 🔵 **Blue**: Selected
  - Atomic double-booking prevention.
- **GPS Nearby Parking**:
  - Browser Geolocation API permission request.
  - Haversine distance calculations in kilometers.
  - Graceful fallback when location permission is denied.
- **Timer Extension**:
  - Active session retrieval, conflict validation, additional fee calculation, and payment verification.
- **Smart Parking Entry Workflow**:
  - RFID scan + ANPR camera plate verification -> Backend authorization -> Gate servo barrier opens -> Vehicle parks -> Ultrasonic sensor triggers occupied -> Entry notification & simulated SMS alert dispatched.
- **Smart Parking Exit Workflow**:
  - RFID tap / ANPR checkout -> Overstay calculation -> Gate opens -> Space clear confirmed -> Slot released -> Exit notification & invoice dispatched.

---

## 2. API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account (7 mandatory fields)
- `POST /api/auth/login` - Sign in & receive JWT
- `GET /api/auth/me` - Authenticated driver profile
- `PATCH /api/auth/me` - Update contact information
- `PATCH /api/auth/me/vehicle` - Update RFID tag & vehicle plate
- `POST /api/auth/change-password` - Secure password update
- `POST /api/auth/logout` - Invalidate session

### Parking & Slots (`/api/parking`)
- `GET /api/parking` - List all facilities
- `GET /api/parking/nearby?lat=...&lng=...` - Haversine GPS nearby search
- `GET /api/parking/:id` - Location details with slot matrix
- `GET /api/parking/:id/slots` - Slots telemetry

### Bookings (`/api/bookings`)
- `POST /api/bookings` - Create slot reservation with atomic lock
- `GET /api/bookings/active` - Authoritative active session & countdown
- `GET /api/bookings/my` - Current driver's bookings
- `GET /api/bookings/:id` - Single booking details
- `POST /api/bookings/:id/extend` - Extend reservation duration
- `POST /api/bookings/:id/cancel` - Cancel booking & process refund

### Barrier Gate & IoT (`/api/gate`)
- `POST /api/gate/entry` - Hardware/simulated vehicle entry verification
- `POST /api/gate/exit` - Hardware/simulated vehicle exit checkout
- `POST /api/gate/sensor` - Ultrasonic / IR slot occupancy update
- `GET /api/gate/status` - Live barrier state and hardware command logs

### Notifications (`/api/notifications`)
- `GET /api/notifications` - In-app notifications feed
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/sms-logs` - Inspect simulated SMS dispatches

### Payments (`/api/payments`)
- `POST /api/payments/simulate` - Simulated sandbox checkout
- `POST /api/payments/verify` - Server-side transaction verification

---

## 3. Quick Start Guide

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Start Backend Server
```bash
node src/server.js
```
The server will start on `http://localhost:5000`. The frontend is automatically served directly by the backend at `http://localhost:5000/`.

### Step 3: Access Application in Browser
Open: `http://localhost:5000/`

Demo Credentials:
- **Email**: `user@smartpark.ai`
- **Password**: `password123`
- **RFID**: `RF-882194`
- **Vehicle Plate**: `SP-EV-8821`

### Step 4: Run Automated Tests
```bash
cd backend
npm test
```
All 19 automated integration tests will run and report status.
