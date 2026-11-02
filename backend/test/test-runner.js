/**
 * ==========================================
 * SMARTPARK AI — AUTONOMOUS TEST SUITE
 * Comprehensive Integration & Verification Runner
 * ==========================================
 */

const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTest(name, fn) {
  process.stdout.write(`Testing: ${name} ... `);
  try {
    await fn();
    console.log(`\x1b[32mPASSED\x1b[0m`);
    results.push({ name, passed: true });
  } catch (err) {
    console.log(`\x1b[31mFAILED\x1b[0m`);
    console.error(`  Error: ${err.message}`);
    results.push({ name, passed: false, error: err.message });
  }
}

async function startSuite() {
  console.log(`=======================================================`);
  console.log(` SMARTPARK AI — FULL-STACK VERIFICATION TEST RUNNER`);
  console.log(`=======================================================\n`);

  // Start test server on random port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      console.log(`[Test Server] Running on ${baseUrl}\n`);
      resolve();
    });
  });

  const testUser = {
    fullName: 'Test Driver',
    email: `test_driver_${Date.now()}@smartpark.ai`,
    phone: '+1-555-9876',
    password: 'password123',
    confirmPassword: 'password123',
    rfid: `RF-${Date.now().toString().slice(-6)}`,
    vehicleNumber: `TN-${Date.now().toString().slice(-4)}`,
  };

  let authToken = '';
  let testUserId = '';
  let createdBookingId = '';
  let createdBookingCode = '';

  // 1. Health check
  await runTest('API Health Endpoint', async () => {
    const res = await request('/health');
    assert(res.status === 200, 'Health status should be 200');
    assert(res.data.status === 'online', 'Service status should be online');
  });

  // 2. Registration & Persistence
  await runTest('User Registration with 7 Mandatory Fields', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    assert(res.status === 201, `Expected status 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.success === true, 'Registration must be successful');
    assert(res.data.token, 'Must return JWT token');
    assert(res.data.user.email === testUser.email.toLowerCase(), 'Must return sanitized email');
    authToken = res.data.token;
    testUserId = res.data.user.id;
  });

  // 3. Duplicate Prevention (Unique Email & RFID)
  await runTest('Duplicate Registration Rejection (409 Conflict)', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    assert(res.status === 409, `Expected 409 conflict, got ${res.status}`);
    assert(res.data.success === false, 'Duplicate must be rejected');
  });

  // 4. Authentication Login
  await runTest('Driver Login with Bcrypt Password Verification', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    assert(res.status === 200, 'Login should succeed');
    assert(res.data.token, 'Must return token');
    authToken = res.data.token;
  });

  // 5. Protected Profile Retrieval
  await runTest('Protected Profile Retrieval (GET /api/auth/me)', async () => {
    const res = await request('/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, 'Profile fetch should succeed');
    assert(res.data.email === testUser.email.toLowerCase(), 'Profile email matches');
    assert(res.data.rfid === testUser.rfid, 'Profile RFID matches');
    assert(!res.data.password, 'Must never return password');
  });

  // 6. Secure Password Change
  await runTest('Secure Password Management (POST /api/auth/change-password)', async () => {
    const res = await request('/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newPassword456',
      }),
    });
    assert(res.status === 200, 'Password change should succeed');
    assert(res.data.success === true, 'Success flag true');

    // Verify login with new password
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: 'newPassword456' }),
    });
    assert(loginRes.status === 200, 'Login with new password should succeed');
  });

  // 7. Parking Locations Retrieval (including VS Mall)
  await runTest('Parking Locations Retrieval with VS Mall', async () => {
    const res = await request('/parking');
    assert(res.status === 200, 'Locations retrieval should succeed');
    assert(Array.isArray(res.data) && res.data.length >= 4, 'Must return at least 4 locations');
    const vsMall = res.data.find((l) => l.name.includes('VS Mall'));
    assert(vsMall, 'VS Mall must be present in parking network');
    assert(vsMall.coordinates && vsMall.coordinates.lat, 'Coordinates must be present');
  });

  // 8. Geolocation Haversine Distance Calculation
  await runTest('Nearby Geolocation Query with Haversine Distances', async () => {
    // User coordinates near city center (11.0180, 76.9600)
    const res = await request('/parking/nearby?lat=11.0180&lng=76.9600');
    assert(res.status === 200, 'Nearby search should succeed');
    assert(res.data.locations && res.data.locations.length > 0, 'Must return nearby locations');
    const nearest = res.data.locations[0];
    assert(nearest.distanceKm !== undefined && nearest.distanceKm >= 0, 'Must compute real distance in km');
    assert(nearest.freeSlots !== undefined, 'Must include free slots');
    assert(nearest.reservedSlots !== undefined, 'Must include reserved slots');
    assert(nearest.occupiedSlots !== undefined, 'Must include occupied slots');
  });

  // 9. Booking Creation with Dynamic Pricing & Conflict Prevention
  await runTest('Slot Booking Creation with Server Pricing ($6.00/hr * 2 hrs = $12.00)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        parkingId: 'loc_vs_mall',
        slot: 'A-15',
        durationHours: 2,
        startTime: new Date().toISOString(),
      }),
    });
    assert(res.status === 201, `Booking creation should succeed, got ${res.status}`);
    assert(res.data.totalFee === 12.0, `Expected total fee 12.00, got ${res.data.totalFee}`);
    assert(res.data.accessCode, 'Must return gate access code');
    createdBookingId = res.data.id || res.data._id;
    createdBookingCode = res.data.accessCode;
  });

  // 10. Conflict Detection (Double Booking Prevention)
  await runTest('Double Booking Prevention on Same Slot (409 Conflict)', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        parkingId: 'loc_vs_mall',
        slot: 'A-15',
        durationHours: 1,
        startTime: new Date().toISOString(),
      }),
    });
    assert(res.status === 409, `Should reject double booking with 409, got ${res.status}`);
    assert(res.data.success === false, 'Double booking must be denied');
  });

  // 11. Authoritative Active Booking Query
  await runTest('Active Session Query (GET /api/bookings/active)', async () => {
    const res = await request('/bookings/active', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, 'Active booking query should succeed');
    assert(res.data.hasActiveBooking === true, 'Must indicate active booking');
    assert(res.data.remainingMinutes > 0, 'Remaining minutes must be positive');
  });

  // 12. Timer Extension Workflow with Server-Side Verification
  await runTest('Timer Extension Workflow (+1 Hour for $6.00)', async () => {
    const res = await request(`/bookings/${createdBookingId}/extend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ additionalHours: 1 }),
    });
    assert(res.status === 200, `Extension should succeed, got ${res.status}`);
    assert(res.data.additionalFee === 6.0, `Additional fee should be 6.00, got ${res.data.additionalFee}`);
    assert(res.data.totalAmount === 18.0, `Total amount should be 18.00, got ${res.data.totalAmount}`);
  });

  // 13. Smart Parking Entry Workflow (RFID & ANPR Barrier Authorization)
  await runTest('Smart Parking Gate Entry Authorization (RFID / ANPR)', async () => {
    const res = await request('/gate/entry', {
      method: 'POST',
      body: JSON.stringify({
        vehicleNumber: testUser.vehicleNumber,
        rfid: testUser.rfid,
      }),
    });
    assert(res.status === 200, `Gate entry should be approved, got ${res.status}`);
    assert(res.data.accessGranted === true, 'Access must be granted');
    assert(res.data.barrierState === 'OPEN', 'Barrier state must be OPEN');
    assert(res.data.slotNumber === 'A-15', 'Must direct to assigned slot A-15');
  });

  // 14. Unauthorized Entry Rejection
  await runTest('Unauthorized Entry Denial (No Valid Booking)', async () => {
    const res = await request('/gate/entry', {
      method: 'POST',
      body: JSON.stringify({
        vehicleNumber: 'UNKNOWN-PLATE-99',
        rfid: 'RF-UNKNOWN-99',
      }),
    });
    assert(res.status === 403, `Unauthorized entry must be 403, got ${res.status}`);
    assert(res.data.accessGranted === false, 'Access must be denied');
    assert(res.data.barrierState === 'CLOSED', 'Barrier must remain CLOSED');
  });

  // 15. ESP32 Ultrasonic Slot Sensor Telemetry
  await runTest('ESP32 Slot Sensor State Update (Occupied <-> Free)', async () => {
    const res = await request('/gate/sensor', {
      method: 'POST',
      body: JSON.stringify({
        parkingLocationId: 'loc_vs_mall',
        slotNumber: 'A-15',
        isOccupied: true,
        sensorType: 'ultrasonic',
      }),
    });
    assert(res.status === 200, 'Sensor update should succeed');
    assert(res.data.slot.isOccupied === true, 'Slot should be marked occupied');
  });

  // 16. Smart Parking Exit Workflow (Session Checkout & Slot Release)
  await runTest('Smart Parking Gate Exit & Slot Release', async () => {
    const res = await request('/gate/exit', {
      method: 'POST',
      body: JSON.stringify({
        vehicleNumber: testUser.vehicleNumber,
        rfid: testUser.rfid,
      }),
    });
    assert(res.status === 200, `Exit should succeed, got ${res.status}`);
    assert(res.data.accessGranted === true, 'Exit access must be granted');
    assert(res.data.barrierState === 'OPEN', 'Barrier must open for exit');

    // Verify slot is now released
    const slotRes = await request(`/parking/loc_vs_mall/slots`);
    const slot = slotRes.data.find((s) => s.slotNumber === 'A-15');
    assert(slot && slot.status === 'available', 'Slot must be released to available');
  });

  // 17. Notifications & Unread Tracking
  await runTest('Notifications Listing & Read State Updates', async () => {
    const res = await request('/notifications', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, 'Notifications list should succeed');
    assert(Array.isArray(res.data.notifications), 'Must return array of notifications');
    assert(res.data.notifications.length >= 2, 'Must have recorded entry and booking notifications');

    // Mark all as read
    const markRes = await request('/notifications/mark-all-read', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(markRes.status === 200, 'Mark all read should succeed');
  });

  // 18. Simulated SMS Alerts Verification
  await runTest('Simulated SMS Gateway Log Verification', async () => {
    const res = await request(`/notifications/sms-logs?phone=${encodeURIComponent(testUser.phone)}`);
    assert(res.status === 200, 'SMS logs query should succeed');
    assert(Array.isArray(res.data.logs), 'Must return SMS logs array');
    assert(res.data.logs.length >= 1, 'Must have recorded at least 1 SMS dispatch');
    assert(res.data.logs[0].deliveryStatus === 'simulated', 'Delivery status must be simulated');
  });

  // 19. Admin Operations
  await runTest('Admin Operations & System Stats', async () => {
    const res = await request('/admin/stats');
    assert(res.status === 200, 'Admin stats should succeed');
    assert(res.data.stats.totalSlots > 0, 'Total slots must be greater than zero');
  });

  // Teardown
  server.close();

  console.log(`\n=======================================================`);
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(` SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length} Tests`);
  console.log(`=======================================================`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

startSuite();
