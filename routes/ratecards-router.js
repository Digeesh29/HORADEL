// Rate Cards Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/ratecards - Get all rate cards with company info
router.get('/', async (req, res) => {
    try {
        console.log('📋 Fetching rate cards...');
        
        const { data, error } = await supabase
            .from('rate_cards')
            .select(`
                *,
                company:companies(id, name, phone, email)
            `)
            .eq('is_active', true)
            .order('effective_from', { ascending: false });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log(`✅ Found ${data?.length || 0} rate cards`);

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('❌ Error fetching rate cards:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rate cards',
            message: error.message
        });
    }
});

// GET /api/ratecards/:id - Get single rate card
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('rate_cards')
            .select(`
                *,
                company:companies(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Rate card not found'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching rate card:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rate card',
            message: error.message
        });
    }
});

// POST /api/ratecards - Create new rate card
router.post('/', async (req, res) => {
    try {
        const { company_id, base_rate, per_article_rate, parcel_type_charges, effective_from } = req.body;

        // Deactivate old rate cards for this company
        await supabase
            .from('rate_cards')
            .update({ is_active: false })
            .eq('company_id', company_id);

        // Insert new rate card
        const { data, error } = await supabase
            .from('rate_cards')
            .insert([{
                company_id,
                base_rate,
                per_article_rate,
                parcel_type_charges,
                effective_from: effective_from || new Date().toISOString().split('T')[0],
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error creating rate card:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create rate card',
            message: error.message
        });
    }
});

// PUT /api/ratecards/:id - Update rate card
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { base_rate, per_article_rate, parcel_type_charges, effective_from } = req.body;

        const { data, error } = await supabase
            .from('rate_cards')
            .update({
                base_rate,
                per_article_rate,
                parcel_type_charges,
                effective_from
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error updating rate card:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update rate card',
            message: error.message
        });
    }
});

module.exports = router;
