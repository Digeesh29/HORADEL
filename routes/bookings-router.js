// Bookings Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/bookings - Get all bookings with filters
router.get('/', async (req, res) => {
    try {
        const { company, status, lrNumber, dateFrom, dateTo } = req.query;

        let query = supabase
            .from('bookings')
            .select(`
                *,
                company:companies(id, name, phone, email),
                vehicle:vehicles(id, registration_number, vehicle_type, capacity),
                driver:drivers(id, name, phone)
            `)
            .order('booking_date', { ascending: false });

        // Apply filters - filter by company name directly in the join
        if (status && status !== 'All') {
            query = query.eq('status', status);
        }
        
        if (lrNumber) {
            query = query.ilike('lr_number', `%${lrNumber}%`);
        }
        
        if (dateFrom) {
            query = query.gte('booking_date', dateFrom);
        }
        
        if (dateTo) {
            query = query.lte('booking_date', dateTo);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter by company name in memory (faster than extra query)
        let filteredData = data || [];
        if (company && company !== 'All') {
            filteredData = filteredData.filter(booking => 
                booking.company?.name === company
            );
        }

        res.json({
            success: true,
            data: filteredData,
            count: filteredData.length
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings',
            message: error.message
        });
    }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_vehicle_id, assigned_driver_id, status } = req.body;

        const updateData = {};
        if (assigned_vehicle_id !== undefined) updateData.assigned_vehicle_id = assigned_vehicle_id;
        if (assigned_driver_id !== undefined) updateData.assigned_driver_id = assigned_driver_id;
        if (status !== undefined) updateData.status = status;

        const { data, error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update booking',
            message: error.message
        });
    }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                company:companies(*),
                vehicle:vehicles(*),
                driver:drivers(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking',
            message: error.message
        });
    }
});

module.exports = router;
