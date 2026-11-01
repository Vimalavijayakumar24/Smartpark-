const http = require("http");
const url = require("url");

const PORT = process.env.PORT || 5000;

// In-memory demo data
const db = {
  users: [
    {
      id: "usr_admin",
      name: "Admin User",
      email: "admin@smartpark.ai",
      password: "password123",
      role: "admin",
    },
    {
      id: "usr_demo",
      name: "Alex Morgan",
      email: "user@smartpark.ai",
      password: "password123",
      role: "driver",
    },
  ],
  userProfile: {
    name: "Alex Morgan",
    email: "user@smartpark.ai",
    phone: "+1 (555) 019-2834",
    vehicle: {
      make: "Tesla",
      model: "Model 3",
      plate: "SP-8821",
    },
  },
  locations: [
    {
      id: "loc_metro_1",
      _id: "loc_metro_1",
      name: "Metro Hub Central Garage",
      address: "104 Central Avenue, Downtown",
      ratePerHour: 4.5,
      totalSlots: 40,
      availableSlots: 14,
      status: "Active",
      rating: 4.8,
    },
    {
      id: "loc_plaza_2",
      _id: "loc_plaza_2",
      name: "City Center Plaza Parking",
      address: "220 Market Street, Financial District",
      ratePerHour: 6.0,
      totalSlots: 50,
      availableSlots: 8,
      status: "Active",
      rating: 4.9,
    },
    {
      id: "loc_tech_3",
      _id: "loc_tech_3",
      name: "Tech Park Deck B",
      address: "450 Innovation Way, Silicon Blvd",
      ratePerHour: 3.5,
      totalSlots: 60,
      availableSlots: 22,
      status: "Active",
      rating: 4.7,
    },
    {
      id: "loc_west_4",
      _id: "loc_west_4",
      name: "Westside Transit Terminal",
      address: "80 Airport Expressway, Westside",
      ratePerHour: 5.0,
      totalSlots: 35,
      availableSlots: 11,
      status: "Active",
      rating: 4.6,
    },
  ],
  notifications: [
    {
      id: "notif_1",
      title: "Smart Reservation Confirmed",
      message: "Slot A-14 booked at Metro Hub Central Garage.",
      time: "10 mins ago",
      read: false,
    },
    {
      id: "notif_2",
      title: "Session Expiring Soon",
      message: "You have 15 minutes remaining on your active parking session.",
      time: "45 mins ago",
      read: false,
    },
    {
      id: "notif_3",
      title: "AI Optimization Update",
      message: "Dynamic rate discount applied for off-peak parking hours.",
      time: "3 hours ago",
      read: true,
    },
  ],
  bookings: [
    {
      id: "bk_1001",
      _id: "bk_1001",
      parkingId: "loc_metro_1",
      locationName: "Metro Hub Central Garage",
      slot: "A-14",
      startTime: new Date(Date.now() - 30 * 60000).toISOString(),
      durationHours: 2,
      endTime: new Date(Date.now() + 90 * 60000).toISOString(),
      status: "Active",
      amount: 9.0,
    },
  ],
};

function sendJSON(res, statusCode, data, origin = "*") {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "*";

  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    });
    return res.end();
  }

  // Helper with origin bound
  const reply = (status, payload) => sendJSON(res, status, payload, origin);

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  console.log(`[${new Date().toISOString().slice(11, 19)}] ${method} ${pathname}`);

  try {
    // --- AUTH ROUTES ---
    if (pathname === "/api/auth/login" && method === "POST") {
      const { email, password } = await parseBody(req);
      if (!email || !password) {
        return reply( 400, { message: "Email and password are required." });
      }

      // Check existing user or allow demo login
      let user = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      if (!user) {
        // Create user session for smooth testing
        user = {
          id: "usr_" + Math.random().toString(36).substring(2, 8),
          name: email.split("@")[0].replace(/[._-]/g, " "),
          email,
          role: email.toLowerCase().includes("admin") ? "admin" : "driver",
        };
        db.users.push(user);
      }

      return reply( 200, {
        success: true,
        message: "Login successful!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    if (pathname === "/api/auth/register" && method === "POST") {
      const { name, email, password } = await parseBody(req);
      if (!email || !name) {
        return reply( 400, { message: "Name and email are required." });
      }

      const existing = db.users.find((u) => u.email === email);
      if (existing) {
        return reply( 409, { message: "An account with this email already exists." });
      }

      const newUser = {
        id: "usr_" + Date.now(),
        name,
        email,
        password: password || "demo123",
        role: "driver",
      };
      db.users.push(newUser);

      return reply( 201, {
        success: true,
        message: "Account created successfully. Please log in.",
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    }

    if (pathname === "/api/auth/logout" && method === "POST") {
      return reply( 200, { success: true, message: "Logged out successfully." });
    }

    if (pathname === "/api/auth/me" && method === "GET") {
      return reply( 200, db.userProfile);
    }

    if (pathname === "/api/auth/me" && method === "PATCH") {
      const updates = await parseBody(req);
      Object.assign(db.userProfile, updates);
      return reply( 200, { success: true, profile: db.userProfile });
    }

    if (pathname === "/api/auth/me/vehicle" && method === "PATCH") {
      const vehicleUpdates = await parseBody(req);
      db.userProfile.vehicle = { ...db.userProfile.vehicle, ...vehicleUpdates };
      return reply( 200, { success: true, vehicle: db.userProfile.vehicle });
    }

    // --- PARKING ROUTES ---
    if (pathname === "/api/parking" && method === "GET") {
      const search = (parsedUrl.query.search || "").toLowerCase().trim();
      let locations = db.locations;
      if (search) {
        locations = locations.filter(
          (loc) =>
            loc.name.toLowerCase().includes(search) ||
            loc.address.toLowerCase().includes(search),
        );
      }
      return reply( 200, locations);
    }

    if (pathname.startsWith("/api/parking/") && method === "GET") {
      const id = pathname.replace("/api/parking/", "");
      const loc = db.locations.find((l) => l.id === id || l._id === id);
      if (!loc) {
        return reply( 404, { message: "Parking location not found." });
      }
      return reply( 200, loc);
    }

    // --- BOOKING ROUTES ---
    if (pathname === "/api/bookings" && method === "POST") {
      const body = await parseBody(req);
      const newBooking = {
        id: "bk_" + Date.now(),
        _id: "bk_" + Date.now(),
        parkingId: body.parkingId || "loc_metro_1",
        slot: body.slot || "A-12",
        startTime: body.startTime || new Date().toISOString(),
        durationHours: Number(body.durationHours) || 2,
        endTime: new Date(Date.now() + (Number(body.durationHours) || 2) * 3600000).toISOString(),
        amount: (Number(body.durationHours) || 2) * 5.0,
        status: "Confirmed",
      };
      db.bookings.push(newBooking);
      return reply( 201, newBooking);
    }

    if (pathname.includes("/extend") && method === "POST") {
      return reply( 200, {
        success: true,
        message: "Parking duration successfully extended by 1 hour.",
        newEndTime: new Date(Date.now() + 2 * 3600000).toISOString(),
      });
    }

    // --- NOTIFICATIONS ---
    if (pathname === "/api/notifications" && method === "GET") {
      return reply( 200, db.notifications);
    }

    if (pathname === "/api/notifications/read-all" && method === "POST") {
      db.notifications.forEach((n) => (n.read = true));
      return reply( 200, { success: true });
    }

    if (pathname.startsWith("/api/notifications/") && pathname.endsWith("/read") && method === "POST") {
      const notifId = pathname.split("/")[3];
      const target = db.notifications.find((n) => n.id === notifId);
      if (target) target.read = true;
      return reply( 200, { success: true });
    }

    // --- PAYMENT SIMULATION ---
    if (pathname === "/api/payments/simulate" && method === "POST") {
      const body = await parseBody(req);
      return reply( 200, {
        id: "pmt_" + Date.now(),
        bookingId: body.bookingId || "bk_1001",
        status: "Completed",
        accessCode: "SP-" + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toISOString(),
        receiptUrl: "#",
      });
    }

    // --- ADMIN OVERVIEW ---
    if (pathname === "/api/admin/overview" && method === "GET") {
      const totalAvailable = db.locations.reduce(
        (sum, l) => sum + Number(l.availableSlots || 0),
        0,
      );
      return reply( 200, {
        locations: db.locations,
        totalBookings: db.bookings.length + 140,
        totalAvailable,
        systemStatus: "All Systems Operational",
      });
    }

    // Catch all 404
    return reply( 404, { message: `Endpoint ${pathname} not found.` });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return reply( 500, { message: "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` SmartPark AI Backend running at:`);
  console.log(` -> http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});
