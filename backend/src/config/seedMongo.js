const User = require('../models/User');
const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Notification = require('../models/Notification');

/**
 * Automatically seeds initial parking facilities, slots, and demo accounts
 * into MongoDB Atlas if the collections are empty.
 */
async function seedMongoDBIfEmpty() {
  try {
    const locationCount = await ParkingLocation.countDocuments();

    if (locationCount === 0) {
      console.log('[Database] Empty MongoDB detected. Seeding initial locations and slots...');

      // 1. Seed Locations
      const locationsData = [
        {
          name: 'VS Mall Parking Complex',
          address: 'Plot 42, Cross-Cut Road, Gandhipuram City Center',
          city: 'Metropolis',
          coordinates: { lat: 11.0183, lng: 76.9644 },
          totalSlots: 24,
          availableSlots: 22,
          ratePerHour: 6.0,
          supportedVehicles: ['Car', 'EV', 'SUV'],
          status: 'Active',
          rating: 4.9,
        },
        {
          name: 'Metro Hub Central Garage',
          address: '104 Central Avenue, Downtown Financial District',
          city: 'Metropolis',
          coordinates: { lat: 11.0168, lng: 76.9558 },
          totalSlots: 20,
          availableSlots: 18,
          ratePerHour: 5.0,
          supportedVehicles: ['Car', 'EV', 'SUV'],
          status: 'Active',
          rating: 4.8,
        },
        {
          name: 'City Center Plaza Parking',
          address: '220 Market Street, Shopping & Civic Plaza',
          city: 'Metropolis',
          coordinates: { lat: 11.0255, lng: 76.968 },
          totalSlots: 20,
          availableSlots: 17,
          ratePerHour: 6.5,
          supportedVehicles: ['Car', 'EV'],
          status: 'Active',
          rating: 4.9,
        },
        {
          name: 'Tech Park Deck B',
          address: '450 Innovation Way, Silicon Corridor',
          city: 'Metropolis',
          coordinates: { lat: 11.0298, lng: 76.9421 },
          totalSlots: 20,
          availableSlots: 19,
          ratePerHour: 4.0,
          supportedVehicles: ['Car', 'EV', 'SUV'],
          status: 'Active',
          rating: 4.7,
        },
      ];

      const insertedLocations = await ParkingLocation.insertMany(locationsData);

      // 2. Generate slots for each location
      for (const loc of insertedLocations) {
        const slotsToInsert = [];
        for (let i = 1; i <= loc.totalSlots; i++) {
          const slotNum = `A-${String(i).padStart(2, '0')}`;
          slotsToInsert.push({
            parkingLocation: loc._id,
            slotNumber: slotNum,
            floor: 'Level 1',
            type: i <= 5 ? 'ev' : 'standard',
            isOccupied: false,
            isReserved: false,
            status: 'available',
            sensorStatus: 'online',
          });
        }
        await ParkingSlot.insertMany(slotsToInsert);
      }
      console.log(`[Database] Seeded ${insertedLocations.length} locations and all parking slots.`);
    }

    // 3. Seed Demo Users if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Database] Seeding default administrator and demo driver accounts...');

      const adminUser = new User({
        fullName: 'System Administrator',
        email: 'admin@smartpark.ai',
        phone: '+1-555-0100',
        password: 'admin123',
        rfid: 'RF-ADMIN-01',
        vehicleNumber: 'SP-ADM-01',
        role: 'admin',
        status: 'active',
      });
      await adminUser.save();

      const demoUser = new User({
        fullName: 'Alex Morgan',
        email: 'user@smartpark.ai',
        phone: '+1-555-0199',
        password: 'password123',
        rfid: 'RF-882194',
        vehicleNumber: 'SP-EV-8821',
        role: 'driver',
        status: 'active',
      });
      await demoUser.save();

      await Notification.create({
        user: demoUser._id,
        title: 'Welcome to SmartPark AI',
        message: 'Your RFID pass and vehicle registration are active on MongoDB Atlas.',
        type: 'success',
      });

      console.log('[Database] Seeded demo users: user@smartpark.ai & admin@smartpark.ai');
    }
  } catch (err) {
    console.warn('[Database] Seeding notice:', err.message);
  }
}

module.exports = { seedMongoDBIfEmpty };
