// Companies Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/companies - Get all companies
router.get('/', async (req, res) => {
    try {
        console.log('🏢 Fetching companies...');
        
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log(`✅ Found ${data?.length || 0} companies`);

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('❌ Error fetching companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies',
            message: error.message
        });
    }
});

// POST /api/companies - Create new company
router.post('/', async (req, res) => {
    try {
        const { name, contact_person, phone, email, company_type, status } = req.body;

        const { data, error } = await supabase
            .from('companies')
            .insert([{
                name,
                contact_person,
                phone,
                email,
                company_type: company_type || 'Corporate',
                status: status || 'Active'
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create company',
            message: error.message
        });
    }
});

module.exports = router;
