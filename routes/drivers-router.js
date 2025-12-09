// Drivers Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/drivers - Get all drivers
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch drivers',
            message: error.message
        });
    }
});

// PUT /api/drivers/:id - Update driver
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_vehicle_id, status, current_status } = req.body;

        const updateData = {};
        if (assigned_vehicle_id !== undefined) updateData.assigned_vehicle_id = assigned_vehicle_id;
        if (status !== undefined) updateData.status = status;
        if (current_status !== undefined) updateData.current_status = current_status;

        const { data, error } = await supabase
            .from('drivers')
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
        console.error('Error updating driver:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update driver',
            message: error.message
        });
    }
});

// POST /api/drivers - Create new driver
router.post('/', async (req, res) => {
    try {
        const { name, phone, license_number, license_type, status, current_status } = req.body;

        const { data, error } = await supabase
            .from('drivers')
            .insert([{
                name,
                phone,
                license_number,
                license_type: license_type || 'HMV',
                status: status || 'Active',
                current_status: current_status || 'Available'
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create driver',
            message: error.message
        });
    }
});

module.exports = router;
