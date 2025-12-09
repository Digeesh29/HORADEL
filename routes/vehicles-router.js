// Vehicles Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/vehicles - Create new vehicle
router.post('/', async (req, res) => {
    try {
        const { registration_number, vehicle_type, capacity, capacity_kg, make, model, year, status, current_driver_id } = req.body;

        const { data, error } = await supabase
            .from('vehicles')
            .insert([{
                registration_number,
                vehicle_type,
                capacity,
                capacity_kg,
                make,
                model,
                year,
                status: status || 'Available',
                current_driver_id
            }])
            .select(`
                *,
                driver:drivers!current_driver_id(id, name, phone)
            `)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create vehicle',
            message: error.message
        });
    }
});

// GET /api/vehicles - Get all vehicles
router.get('/', async (req, res) => {
    try {
        console.log('📍 Fetching vehicles...');
        
        const { data, error } = await supabase
            .from('vehicles')
            .select(`
                *,
                driver:drivers!current_driver_id(id, name, phone)
            `)
            .order('registration_number');

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log(`✅ Found ${data?.length || 0} vehicles`);

        // Get all IN-TRANSIT bookings (assigned to vehicles)
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('assigned_vehicle_id')
            .eq('status', 'IN-TRANSIT');

        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
        }

        // Count bookings per vehicle
        const bookingCounts = {};
        (bookings || []).forEach(b => {
            if (b.assigned_vehicle_id) {
                bookingCounts[b.assigned_vehicle_id] = (bookingCounts[b.assigned_vehicle_id] || 0) + 1;
            }
        });

        // Add counts to vehicles
        const vehiclesWithBookings = (data || []).map(vehicle => ({
            ...vehicle,
            assignedParcels: bookingCounts[vehicle.id] || 0
        }));

        res.json({
            success: true,
            data: vehiclesWithBookings
        });
    } catch (error) {
        console.error('❌ Error fetching vehicles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vehicles',
            message: error.message,
            details: error.toString()
        });
    }
});

module.exports = router;
