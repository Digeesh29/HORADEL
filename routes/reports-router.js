// Reports Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/reports/summary - Get overall summary statistics
router.get('/summary', async (req, res) => {
    try {
        const { dateFrom, dateTo, companyId } = req.query;

        let query = supabase
            .from('bookings')
            .select('grand_total, status, company_id');

        // Apply date filters
        if (dateFrom) {
            query = query.gte('booking_date', dateFrom);
        }
        if (dateTo) {
            query = query.lte('booking_date', dateTo);
        }
        if (companyId && companyId !== 'All') {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calculate summary statistics
        const totalRevenue = data.reduce((sum, b) => sum + (parseFloat(b.grand_total) || 0), 0);
        const totalBookings = data.length;
        const totalDispatches = data.filter(b => b.status === 'IN-TRANSIT' || b.status === 'DELIVERED').length;
        const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue.toFixed(2),
                totalBookings,
                totalDispatches,
                avgRevenuePerBooking: avgRevenuePerBooking.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch summary',
            message: error.message
        });
    }
});

// GET /api/reports/revenue-trend - Get revenue trend over time
router.get('/revenue-trend', async (req, res) => {
    try {
        const { dateFrom, dateTo, companyId } = req.query;

        let query = supabase
            .from('bookings')
            .select('booking_date, grand_total, company_id')
            .order('booking_date');

        if (dateFrom) query = query.gte('booking_date', dateFrom);
        if (dateTo) query = query.lte('booking_date', dateTo);
        if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);

        const { data, error } = await query;

        if (error) throw error;

        // Group by month
        const monthlyRevenue = {};
        data.forEach(booking => {
            const date = new Date(booking.booking_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyRevenue[monthKey]) {
                monthlyRevenue[monthKey] = 0;
            }
            monthlyRevenue[monthKey] += parseFloat(booking.grand_total) || 0;
        });

        // Convert to array and sort
        const trend = Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month, revenue: revenue.toFixed(2) }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months

        res.json({
            success: true,
            data: trend
        });
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue trend',
            message: error.message
        });
    }
});

// GET /api/reports/company-summary - Get company-wise summary
router.get('/company-summary', async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;

        let query = supabase
            .from('bookings')
            .select(`
                grand_total,
                company:companies(id, name)
            `);

        if (dateFrom) query = query.gte('booking_date', dateFrom);
        if (dateTo) query = query.lte('booking_date', dateTo);

        const { data, error } = await query;

        if (error) throw error;

        // Group by company
        const companySummary = {};
        data.forEach(booking => {
            const companyName = booking.company?.name || 'Unknown';
            
            if (!companySummary[companyName]) {
                companySummary[companyName] = {
                    totalRevenue: 0,
                    totalBookings: 0
                };
            }
            
            companySummary[companyName].totalRevenue += parseFloat(booking.grand_total) || 0;
            companySummary[companyName].totalBookings += 1;
        });

        // Convert to array with averages
        const summary = Object.entries(companySummary).map(([company, stats]) => ({
            company,
            totalRevenue: stats.totalRevenue.toFixed(2),
            totalBookings: stats.totalBookings,
            avgPerBooking: (stats.totalRevenue / stats.totalBookings).toFixed(2)
        })).sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue));

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching company summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company summary',
            message: error.message
        });
    }
});

// GET /api/reports/parcel-type-distribution - Get parcel type distribution
router.get('/parcel-type-distribution', async (req, res) => {
    try {
        const { dateFrom, dateTo, companyId } = req.query;

        let query = supabase
            .from('bookings')
            .select('parcel_type');

        if (dateFrom) query = query.gte('booking_date', dateFrom);
        if (dateTo) query = query.lte('booking_date', dateTo);
        if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);

        const { data, error } = await query;

        if (error) throw error;

        // Count by parcel type
        const typeCounts = {};
        data.forEach(booking => {
            const type = booking.parcel_type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const total = data.length;
        const distribution = Object.entries(typeCounts).map(([type, count]) => ({
            type,
            count,
            percentage: ((count / total) * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: distribution
        });
    } catch (error) {
        console.error('Error fetching parcel type distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch parcel type distribution',
            message: error.message
        });
    }
});

// GET /api/reports/vehicle-dispatch - Get vehicle dispatch statistics
router.get('/vehicle-dispatch', async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;

        let query = supabase
            .from('bookings')
            .select(`
                assigned_vehicle_id,
                vehicle:vehicles!assigned_vehicle_id(registration_number)
            `)
            .not('assigned_vehicle_id', 'is', null);

        if (dateFrom) query = query.gte('booking_date', dateFrom);
        if (dateTo) query = query.lte('booking_date', dateTo);

        const { data, error } = await query;

        if (error) throw error;

        // Count dispatches per vehicle
        const vehicleDispatches = {};
        data.forEach(booking => {
            const vehicleNumber = booking.vehicle?.registration_number || 'Unknown';
            vehicleDispatches[vehicleNumber] = (vehicleDispatches[vehicleNumber] || 0) + 1;
        });

        const dispatches = Object.entries(vehicleDispatches)
            .map(([vehicle, count]) => ({ vehicle, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 vehicles

        res.json({
            success: true,
            data: dispatches
        });
    } catch (error) {
        console.error('Error fetching vehicle dispatch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vehicle dispatch',
            message: error.message
        });
    }
});

module.exports = router;
