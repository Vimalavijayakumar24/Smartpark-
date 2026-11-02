const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getIsConnected } = require('../config/db');

// Mongoose Models
const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const ParkingSession = require('../models/ParkingSession');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// Local file storage backup path
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'smartpark-store.json');

// In-memory dual-mode store
const memory = {
  users: [],
  locations: [],
  slots: [],
  bookings: [],
  sessions: [],
  payments: [],
  notifications: [],
};

// Haversine distance calculation in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Persist memory store to JSON file
const saveToDisk = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DataStore] Could not write cache to disk:', err.message);
  }
};

// Load memory store from JSON file if available
const loadFromDisk = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.locations) && parsed.locations.length > 0) {
        Object.assign(memory, parsed);
        console.log('[DataStore] Loaded persistent dataset from local storage cache.');
        return true;
      }
    }
  } catch (err) {
    console.warn('[DataStore] Cache load error:', err.message);
  }
  return false;
};

// Seed initial memory locations and slots
const initMemoryStore = () => {
  if (loadFromDisk()) {
    // If cache loaded but users need helper methods attached
    memory.users.forEach((u) => {
      if (!u.matchPassword) {
        u.matchPassword = async function (entered) {
          return bcrypt.compare(entered, this.password);
        };
      }
    });
    return;
  }

  // VS Mall is a top priority facility as requested
  const locVsMall = {
    _id: 'loc_vs_mall',
    id: 'loc_vs_mall',
    name: 'VS Mall Parking Complex',
    address: 'Plot 42, Cross-Cut Road, Gandhipuram City Center',
    city: 'Metropolis',
    coordinates: { lat: 11.0183, lng: 76.9644 },
    totalSlots: 24,
    availableSlots: 18,
    ratePerHour: 6.0,
    supportedVehicles: ['Car', 'EV', 'SUV'],
    status: 'Active',
    rating: 4.9,
    createdAt: new Date(),
  };

  const locMetro = {
    _id: 'loc_metro_1',
    id: 'loc_metro_1',
    name: 'Metro Hub Central Garage',
    address: '104 Central Avenue, Downtown Financial District',
    city: 'Metropolis',
    coordinates: { lat: 11.0168, lng: 76.9558 },
    totalSlots: 20,
    availableSlots: 14,
    ratePerHour: 5.0,
    supportedVehicles: ['Car', 'EV', 'SUV'],
    status: 'Active',
    rating: 4.8,
    createdAt: new Date(),
  };

  const locPlaza = {
    _id: 'loc_plaza_2',
    id: 'loc_plaza_2',
    name: 'City Center Plaza Parking',
    address: '220 Market Street, Shopping & Civic Plaza',
    city: 'Metropolis',
    coordinates: { lat: 11.0255, lng: 76.968 },
    totalSlots: 20,
    availableSlots: 16,
    ratePerHour: 6.5,
    supportedVehicles: ['Car', 'EV'],
    status: 'Active',
    rating: 4.9,
    createdAt: new Date(),
  };

  const locTech = {
    _id: 'loc_tech_3',
    id: 'loc_tech_3',
    name: 'Tech Park Deck B',
    address: '450 Innovation Way, Silicon Corridor',
    city: 'Metropolis',
    coordinates: { lat: 11.042, lng: 76.985 },
    totalSlots: 20,
    availableSlots: 18,
    ratePerHour: 4.0,
    supportedVehicles: ['Car', 'EV', 'SUV'],
    status: 'Active',
    rating: 4.7,
    createdAt: new Date(),
  };

  memory.locations.push(locVsMall, locMetro, locPlaza, locTech);

  // Generate slots for each location
  [locVsMall, locMetro, locPlaza, locTech].forEach((loc) => {
    for (let i = 1; i <= loc.totalSlots; i++) {
      const slotNum = `A-${String(i).padStart(2, '0')}`;
      const isOccupied = i === 3 || i === 7;
      const isReserved = i === 12;
      memory.slots.push({
        _id: `slot_${loc._id}_${slotNum}`,
        id: `slot_${loc._id}_${slotNum}`,
        parkingLocation: loc._id,
        slotNumber: slotNum,
        floor: 'Level 1',
        type: i <= 6 ? 'ev' : i === 1 ? 'accessible' : 'standard',
        isOccupied,
        isReserved,
        status: isOccupied ? 'occupied' : isReserved ? 'reserved' : 'available',
        sensorStatus: 'online',
        sensorLastUpdated: new Date(),
        currentBooking: null,
        createdAt: new Date(),
      });
    }
  });

  // Seed default admin and driver accounts
  const salt = bcrypt.genSaltSync(10);
  const demoDriver = {
    _id: 'usr_demo',
    id: 'usr_demo',
    fullName: 'Alex Morgan',
    email: 'user@smartpark.ai',
    phone: '+1-555-0199',
    password: bcrypt.hashSync('password123', salt),
    rfid: 'RF-882194',
    vehicleNumber: 'SP-EV-8821',
    role: 'driver',
    status: 'active',
    createdAt: new Date(),
    async matchPassword(enteredPassword) {
      return bcrypt.compare(enteredPassword, this.password);
    },
  };

  const demoAdmin = {
    _id: 'usr_admin',
    id: 'usr_admin',
    fullName: 'System Administrator',
    email: 'admin@smartpark.ai',
    phone: '+1-555-0100',
    password: bcrypt.hashSync('admin123', salt),
    rfid: 'RF-ADMIN-01',
    vehicleNumber: 'SP-ADM-01',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    async matchPassword(enteredPassword) {
      return bcrypt.compare(enteredPassword, this.password);
    },
  };

  memory.users.push(demoDriver, demoAdmin);

  // Seed an initial confirmed booking for the demo user
  const initialBooking = {
    _id: 'bk_demo_active',
    id: 'bk_demo_active',
    bookingCode: 'SP-8421',
    user: 'usr_demo',
    parkingLocation: 'loc_vs_mall',
    slotNumber: 'A-05',
    vehicleNumber: 'SP-EV-8821',
    rfid: 'RF-882194',
    startTime: new Date(Date.now() - 30 * 60000),
    durationHours: 2,
    expectedEndTime: new Date(Date.now() + 90 * 60000), // 1.5 hours left
    ratePerHour: 6.0,
    totalAmount: 12.0,
    status: 'confirmed',
    paymentStatus: 'paid',
    arrivedAt: null,
    departedAt: null,
    cancelledAt: null,
    refundAmount: 0,
    createdAt: new Date(Date.now() - 30 * 60000),
  };
  memory.bookings.push(initialBooking);

  // Mark slot A-05 at VS Mall as reserved
  const slotA5 = memory.slots.find(
    (s) => s.parkingLocation === 'loc_vs_mall' && s.slotNumber === 'A-05'
  );
  if (slotA5) {
    slotA5.isReserved = true;
    slotA5.status = 'reserved';
    slotA5.currentBooking = 'bk_demo_active';
  }

  // Seed initial notification
  memory.notifications.push({
    _id: 'notif_welcome',
    id: 'notif_welcome',
    user: 'usr_demo',
    title: 'Welcome to SmartPark AI',
    titleTa: 'SmartPark AI-க்கு வரவேற்கிறோம்',
    message: 'Your RFID pass and vehicle registration are active. Slot A-05 at VS Mall is reserved.',
    messageTa: 'உங்கள் RFID பாஸ் மற்றும் வாகன பதிவு செயல்பாட்டில் உள்ளன. வி.எஸ் மாலில் A-05 முன்பதிவு செய்யப்பட்டுள்ளது.',
    type: 'success',
    category: 'booking',
    read: false,
    createdAt: new Date(Date.now() - 25 * 60000),
  });

  saveToDisk();
};

initMemoryStore();

// --- DATA ACCESS LAYER ---
const DataStore = {
  // USER METHODS
  async findUserByEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (getIsConnected()) {
      try {
        return await User.findOne({ email: normalized });
      } catch (e) {
        console.warn('[DataStore] Mongo findUserByEmail fallback:', e.message);
      }
    }
    return memory.users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async findUserById(id) {
    if (getIsConnected()) {
      try {
        return await User.findById(id);
      } catch (e) {
        // fallback
      }
    }
    return (
      memory.users.find(
        (u) => String(u._id) === String(id) || String(u.id) === String(id)
      ) || null
    );
  },

  async findUserByRfid(rfid) {
    const normalized = String(rfid || '').trim().toUpperCase();
    if (getIsConnected()) {
      try {
        return await User.findOne({ rfid: normalized });
      } catch (e) {
        // fallback
      }
    }
    return memory.users.find((u) => u.rfid.toUpperCase() === normalized) || null;
  },

  async findUserByVehicle(vehicleNumber) {
    const normalized = String(vehicleNumber || '').trim().toUpperCase();
    if (getIsConnected()) {
      try {
        return await User.findOne({ vehicleNumber: normalized });
      } catch (e) {
        // fallback
      }
    }
    return (
      memory.users.find((u) => u.vehicleNumber.toUpperCase() === normalized) || null
    );
  },

  async createUser(userData) {
    if (getIsConnected()) {
      try {
        const user = new User(userData);
        const saved = await user.save();
        saveToDisk();
        return saved;
      } catch (e) {
        console.warn('[DataStore] Mongo createUser fallback:', e.message);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const newUser = {
      _id: `usr_${Date.now()}`,
      id: `usr_${Date.now()}`,
      fullName: userData.fullName.trim(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone.trim(),
      password: hashedPassword,
      rfid: userData.rfid.trim().toUpperCase(),
      vehicleNumber: userData.vehicleNumber.trim().toUpperCase(),
      role: userData.role || 'driver',
      status: 'active',
      createdAt: new Date(),
      async matchPassword(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
      },
    };
    memory.users.push(newUser);
    saveToDisk();
    return newUser;
  },

  async updateUser(id, updates) {
    if (getIsConnected()) {
      try {
        return await User.findByIdAndUpdate(id, updates, { new: true });
      } catch (e) {
        // fallback
      }
    }
    const user = await this.findUserById(id);
    if (user) {
      Object.assign(user, updates);
      saveToDisk();
    }
    return user;
  },

  async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    if (getIsConnected()) {
      try {
        return await User.findByIdAndUpdate(
          id,
          { password: hashedPassword },
          { new: true }
        );
      } catch (e) {
        // fallback
      }
    }

    const user = await this.findUserById(id);
    if (user) {
      user.password = hashedPassword;
      saveToDisk();
    }
    return user;
  },

  // PARKING LOCATIONS
  async getLocations(search = '') {
    const query = String(search || '').toLowerCase().trim();
    if (getIsConnected()) {
      try {
        const filter = query
          ? {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { address: { $regex: query, $options: 'i' } },
              ],
            }
          : {};
        const docs = await ParkingLocation.find(filter);
        if (docs && docs.length > 0) return docs;
      } catch (e) {
        // fallback
      }
    }

    if (!query) return memory.locations;
    return memory.locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.address.toLowerCase().includes(query)
    );
  },

  async getLocationById(id) {
    if (getIsConnected()) {
      try {
        const doc = await ParkingLocation.findById(id);
        if (doc) return doc;
      } catch (e) {
        // fallback
      }
    }
    return (
      memory.locations.find(
        (l) => String(l._id) === String(id) || String(l.id) === String(id)
      ) || null
    );
  },

  async getNearbyLocations(userLat, userLng, maxDistanceKm = 50) {
    const allLocations = await this.getLocations();
    const results = allLocations.map((loc) => {
      const coords = loc.coordinates || { lat: 11.0168, lng: 76.9558 };
      const distance = calculateHaversineDistance(
        userLat,
        userLng,
        coords.lat,
        coords.lng
      );
      const locId = loc._id || loc.id;
      const slots = memory.slots.filter((s) => String(s.parkingLocation) === String(locId));
      const freeSlots = slots.filter((s) => s.status === 'available').length;
      const reservedSlots = slots.filter((s) => s.status === 'reserved').length;
      const occupiedSlots = slots.filter((s) => s.status === 'occupied').length;

      return {
        id: locId,
        _id: locId,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        coordinates: coords,
        distanceKm: distance,
        ratePerHour: loc.ratePerHour,
        totalSlots: loc.totalSlots || slots.length,
        freeSlots,
        reservedSlots,
        occupiedSlots,
        availableSlots: freeSlots,
        rating: loc.rating || 4.8,
        status: loc.status || 'Active',
      };
    });

    return results
      .filter((r) => r.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  // PARKING SLOTS
  async getSlotsForLocation(locationId) {
    if (getIsConnected()) {
      try {
        const docs = await ParkingSlot.find({ parkingLocation: locationId }).sort({
          slotNumber: 1,
        });
        if (docs && docs.length > 0) return docs;
      } catch (e) {
        // fallback
      }
    }
    return memory.slots.filter(
      (s) => String(s.parkingLocation) === String(locationId)
    );
  },

  async getSlot(locationId, slotNumber) {
    if (getIsConnected()) {
      try {
        const doc = await ParkingSlot.findOne({
          parkingLocation: locationId,
          slotNumber: slotNumber.toUpperCase(),
        });
        if (doc) return doc;
      } catch (e) {
        // fallback
      }
    }
    return (
      memory.slots.find(
        (s) =>
          String(s.parkingLocation) === String(locationId) &&
          s.slotNumber.toUpperCase() === slotNumber.toUpperCase()
      ) || null
    );
  },

  async updateSlot(locationId, slotNumber, updates) {
    if (getIsConnected()) {
      try {
        await ParkingSlot.findOneAndUpdate(
          { parkingLocation: locationId, slotNumber: slotNumber.toUpperCase() },
          updates,
          { new: true }
        );
      } catch (e) {
        // fallback
      }
    }
    const slot = await this.getSlot(locationId, slotNumber);
    if (slot) {
      Object.assign(slot, updates);
      saveToDisk();
    }
    return slot;
  },

  // BOOKINGS
  async isSlotAvailable(locationId, slotNumber, startTime, expectedEndTime, excludeBookingId = null) {
    const start = new Date(startTime);
    const end = new Date(expectedEndTime);

    // Check slot physical occupancy first
    const slot = await this.getSlot(locationId, slotNumber);
    if (slot && slot.isOccupied) {
      return false;
    }

    if (getIsConnected()) {
      try {
        const filter = {
          parkingLocation: locationId,
          slotNumber: slotNumber.toUpperCase(),
          status: { $in: ['confirmed', 'active'] },
          $or: [{ startTime: { $lt: end }, expectedEndTime: { $gt: start } }],
        };
        if (excludeBookingId) {
          filter._id = { $ne: excludeBookingId };
        }
        const conflict = await Booking.findOne(filter);
        if (conflict) return false;
      } catch (e) {
        // fallback
      }
    }

    const conflict = memory.bookings.find((b) => {
      if (
        excludeBookingId &&
        (String(b._id) === String(excludeBookingId) ||
          String(b.id) === String(excludeBookingId))
      ) {
        return false;
      }
      if (String(b.parkingLocation) !== String(locationId)) return false;
      if (b.slotNumber.toUpperCase() !== slotNumber.toUpperCase()) return false;
      if (!['confirmed', 'active'].includes(b.status)) return false;

      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.expectedEndTime);
      return bStart < end && bEnd > start;
    });

    return !conflict;
  },

  async createBooking(bookingData) {
    const code = `SP-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullData = { ...bookingData, bookingCode: code };

    if (getIsConnected()) {
      try {
        const booking = new Booking(fullData);
        const saved = await booking.save();
        await this.updateSlot(bookingData.parkingLocation, bookingData.slotNumber, {
          isReserved: true,
          status: 'reserved',
          currentBooking: saved._id,
        });
        saveToDisk();
        return saved;
      } catch (e) {
        console.warn('[DataStore] Mongo booking save failed:', e.message);
      }
    }

    const newBooking = {
      _id: `bk_${Date.now()}`,
      id: `bk_${Date.now()}`,
      ...fullData,
      createdAt: new Date(),
    };
    memory.bookings.unshift(newBooking);

    await this.updateSlot(bookingData.parkingLocation, bookingData.slotNumber, {
      isReserved: true,
      status: 'reserved',
      currentBooking: newBooking._id,
    });

    saveToDisk();
    return newBooking;
  },

  async getBookingById(id) {
    if (getIsConnected()) {
      try {
        const b = await Booking.findById(id)
          .populate('parkingLocation')
          .populate('user', 'fullName email phone vehicleNumber rfid');
        if (b) return b;
      } catch (e) {
        // fallback
      }
    }
    const b =
      memory.bookings.find(
        (x) => String(x._id) === String(id) || String(x.id) === String(id)
      ) || null;
    if (b && typeof b.parkingLocation === 'string') {
      const loc = memory.locations.find((l) => String(l._id) === b.parkingLocation);
      return {
        ...b,
        parkingLocation: loc || { name: 'VS Mall Parking Complex' },
      };
    }
    return b;
  },

  async getUserBookings(userId) {
    if (getIsConnected()) {
      try {
        const list = await Booking.find({ user: userId })
          .populate('parkingLocation')
          .sort({ createdAt: -1 });
        if (list && list.length > 0) return list;
      } catch (e) {
        // fallback
      }
    }
    const list = memory.bookings
      .filter((b) => String(b.user) === String(userId))
      .map((b) => {
        const loc = memory.locations.find(
          (l) => String(l._id) === String(b.parkingLocation)
        );
        return {
          ...b,
          parkingLocation: loc || {
            name: 'VS Mall Parking Complex',
            address: 'Plot 42, Cross-Cut Road',
          },
        };
      });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateBooking(id, updates) {
    if (getIsConnected()) {
      try {
        await Booking.findByIdAndUpdate(id, updates, { new: true });
      } catch (e) {
        // fallback
      }
    }
    const b = memory.bookings.find(
      (x) => String(x._id) === String(id) || String(x.id) === String(id)
    );
    if (b) {
      Object.assign(b, updates);
      saveToDisk();
    }
    return b;
  },

  async getAllBookings() {
    if (getIsConnected()) {
      try {
        const list = await Booking.find()
          .populate('parkingLocation')
          .populate('user', 'fullName email vehicleNumber')
          .sort({ createdAt: -1 });
        if (list && list.length > 0) return list;
      } catch (e) {
        // fallback
      }
    }
    return memory.bookings.map((b) => {
      const loc = memory.locations.find(
        (l) => String(l._id) === String(b.parkingLocation)
      );
      const user = memory.users.find((u) => String(u._id) === String(b.user));
      return {
        ...b,
        parkingLocation: loc || { name: 'SmartPark Hub' },
        user: user || { fullName: 'Driver', email: 'driver@smartpark.ai' },
      };
    });
  },

  // SESSIONS (Hardware Gate Entry & Exit)
  async createSession(sessionData) {
    const code = `SES-${Date.now().toString(36).toUpperCase()}`;
    const full = { sessionCode: code, ...sessionData, createdAt: new Date() };

    if (getIsConnected()) {
      try {
        const ses = new ParkingSession(full);
        return await ses.save();
      } catch (e) {
        // fallback
      }
    }

    const newSes = { _id: `ses_${Date.now()}`, id: `ses_${Date.now()}`, ...full };
    memory.sessions.unshift(newSes);
    saveToDisk();
    return newSes;
  },

  async getActiveSessionForVehicle(vehicleNumber, rfid = null) {
    const plate = String(vehicleNumber || '').toUpperCase();
    const tag = String(rfid || '').toUpperCase();

    if (getIsConnected()) {
      try {
        const filter = { status: 'active' };
        if (plate && tag) {
          filter.$or = [{ vehicleNumber: plate }, { rfid: tag }];
        } else if (plate) {
          filter.vehicleNumber = plate;
        } else if (tag) {
          filter.rfid = tag;
        }
        const ses = await ParkingSession.findOne(filter);
        if (ses) return ses;
      } catch (e) {
        // fallback
      }
    }

    return (
      memory.sessions.find(
        (s) =>
          s.status === 'active' &&
          ((plate && s.vehicleNumber === plate) || (tag && s.rfid === tag))
      ) || null
    );
  },

  async updateSession(id, updates) {
    if (getIsConnected()) {
      try {
        return await ParkingSession.findByIdAndUpdate(id, updates, { new: true });
      } catch (e) {
        // fallback
      }
    }
    const s = memory.sessions.find(
      (x) => String(x._id) === String(id) || String(x.id) === String(id)
    );
    if (s) {
      Object.assign(s, updates);
      saveToDisk();
    }
    return s;
  },

  // PAYMENTS
  async createPayment(paymentData) {
    if (getIsConnected()) {
      try {
        const p = new Payment(paymentData);
        return await p.save();
      } catch (e) {
        // fallback
      }
    }
    const newPayment = {
      _id: `pay_${Date.now()}`,
      id: `pay_${Date.now()}`,
      ...paymentData,
      createdAt: new Date(),
    };
    memory.payments.unshift(newPayment);
    saveToDisk();
    return newPayment;
  },

  async getPaymentsByUser(userId) {
    if (getIsConnected()) {
      try {
        return await Payment.find({ user: userId }).sort({ createdAt: -1 });
      } catch (e) {
        // fallback
      }
    }
    return memory.payments.filter((p) => String(p.user) === String(userId));
  },

  // NOTIFICATIONS
  async createNotification(notifData) {
    if (getIsConnected()) {
      try {
        const notif = new Notification(notifData);
        return await notif.save();
      } catch (e) {
        // fallback
      }
    }
    const newNotif = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ...notifData,
      read: false,
      createdAt: new Date(),
    };
    memory.notifications.unshift(newNotif);
    saveToDisk();
    return newNotif;
  },

  async getUserNotifications(userId) {
    if (getIsConnected()) {
      try {
        return await Notification.find({
          $or: [{ user: userId }, { user: null }],
        }).sort({ createdAt: -1 });
      } catch (e) {
        // fallback
      }
    }
    return memory.notifications
      .filter((n) => !n.user || String(n.user) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markNotificationRead(id) {
    if (getIsConnected()) {
      try {
        return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
      } catch (e) {
        // fallback
      }
    }
    const n = memory.notifications.find(
      (x) => String(x._id) === String(id) || String(x.id) === String(id)
    );
    if (n) {
      n.read = true;
      saveToDisk();
    }
    return n;
  },

  async markAllNotificationsRead(userId) {
    if (getIsConnected()) {
      try {
        return await Notification.updateMany(
          { $or: [{ user: userId }, { user: null }] },
          { read: true }
        );
      } catch (e) {
        // fallback
      }
    }
    memory.notifications.forEach((n) => {
      if (!n.user || String(n.user) === String(userId)) {
        n.read = true;
      }
    });
    saveToDisk();
    return { success: true };
  },
};

module.exports = DataStore;
