// Dashboard Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/dashboard - Get dashboard data (total bookings + recent 10 bookings)
router.get('/', async (req, res) => {
    try {
        // Get total bookings count
        const { count: totalBookings, error: countError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Get recent 10 bookings with related data
        const { data: recentBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
                id,
                lr_number,
                booking_date,
                consignee_name,
                destination,
                article_count,
                parcel_type,
                status,
                grand_total,
                company:companies (
                    id,
                    name,
                    phone
                ),
                vehicle:vehicles (
                    id,
                    registration_number,
                    vehicle_type
                ),
                driver:drivers (
                    id,
                    name,
                    phone
                )
            `)
            .order('booking_date', { ascending: false })
            .limit(10);

        if (bookingsError) throw bookingsError;

        res.json({
            success: true,
            data: {
                totalBookings: totalBookings || 0,
                recentBookings: recentBookings || []
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message
        });
    }
});

// GET /api/dashboard/stats - Get dashboard statistics with growth rates
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Get today's bookings count
        const { count: todayBookings, error: todayError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .gte('booking_date', today);

        if (todayError) throw todayError;

        // Get yesterday's bookings count
        const { count: yesterdayBookings, error: yesterdayError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .gte('booking_date', yesterday)
            .lt('booking_date', today);

        if (yesterdayError) throw yesterdayError;

        // Get total bookings count
        const { count: totalBookings, error: totalError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // Get total bookings from yesterday
        const yesterdayDate = new Date(Date.now() - 86400000);
        const { count: totalBookingsYesterday, error: totalYesterdayError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .lt('booking_date', today);

        if (totalYesterdayError) throw totalYesterdayError;

        // Get dispatched vehicles count
        const { count: dispatchedVehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Dispatched');

        if (vehiclesError) throw vehiclesError;

        // Get yesterday's dispatched vehicles (approximate by checking updated_at)
        const { count: dispatchedVehiclesYesterday, error: vehiclesYesterdayError } = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Dispatched')
            .lt('updated_at', today);

        if (vehiclesYesterdayError) throw vehiclesYesterdayError;

        // Get pending deliveries count (IN-TRANSIT bookings)
        const { count: pendingDeliveries, error: pendingError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'IN-TRANSIT');

        if (pendingError) throw pendingError;

        // Get yesterday's pending deliveries
        const { count: pendingDeliveriesYesterday, error: pendingYesterdayError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'IN-TRANSIT')
            .lt('updated_at', today);

        if (pendingYesterdayError) throw pendingYesterdayError;

        // Calculate growth rates
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // Get active vehicles (Available or Dispatched)
        const { count: activeVehicles, error: activeVehiclesError } = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Available', 'Dispatched']);

        if (activeVehiclesError) throw activeVehiclesError;

        // Get yesterday's active vehicles
        const { count: activeVehiclesYesterday, error: activeVehiclesYesterdayError } = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Available', 'Dispatched'])
            .lt('updated_at', today);

        if (activeVehiclesYesterdayError) throw activeVehiclesYesterdayError;

        // Get parcels in transit (sum of article_count for IN-TRANSIT bookings)
        const { data: transitBookings, error: transitError } = await supabase
            .from('bookings')
            .select('article_count')
            .eq('status', 'IN-TRANSIT');

        if (transitError) throw transitError;

        const parcelsInTransit = (transitBookings || []).reduce((sum, b) => sum + (b.article_count || 0), 0);

        // Get yesterday's parcels in transit
        const { data: transitBookingsYesterday, error: transitYesterdayError } = await supabase
            .from('bookings')
            .select('article_count')
            .eq('status', 'IN-TRANSIT')
            .lt('updated_at', today);

        if (transitYesterdayError) throw transitYesterdayError;

        const parcelsInTransitYesterday = (transitBookingsYesterday || []).reduce((sum, b) => sum + (b.article_count || 0), 0);

        res.json({
            success: true,
            data: {
                todayBookings: todayBookings || 0,
                todayBookingsGrowth: calculateGrowth(todayBookings || 0, yesterdayBookings || 0),
                activeVehicles: activeVehicles || 0,
                activeVehiclesGrowth: calculateGrowth(activeVehicles || 0, activeVehiclesYesterday || 0),
                parcelsInTransit: parcelsInTransit || 0,
                parcelsInTransitGrowth: calculateGrowth(parcelsInTransit || 0, parcelsInTransitYesterday || 0),
                pendingDeliveries: pendingDeliveries || 0,
                pendingDeliveriesGrowth: calculateGrowth(pendingDeliveries || 0, pendingDeliveriesYesterday || 0)
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics',
            message: error.message
        });
    }
});

// GET /api/dashboard/recent-bookings - Get recent 10 bookings
router.get('/recent-bookings', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                id,
                lr_number,
                booking_date,
                consignee_name,
                consignee_contact,
                origin,
                destination,
                destination_pincode,
                article_count,
                parcel_type,
                weight,
                status,
                total_amount,
                gst_amount,
                grand_total,
                payment_status,
                dispatched_at,
                estimated_delivery,
                delivered_at,
                notes,
                created_at,
                updated_at,
                company:companies (
                    id,
                    name,
                    phone,
                    email,
                    contact_person
                ),
                vehicle:vehicles (
                    id,
                    registration_number,
                    vehicle_type,
                    capacity,
                    status
                ),
                driver:drivers (
                    id,
                    name,
                    phone,
                    license_number
                )
            `)
            .order('booking_date', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({
            success: true,
            data: data || [],
            count: data?.length || 0
        });
    } catch (error) {
        console.error('Error fetching recent bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent bookings',
            message: error.message
        });
    }
});

// GET /api/dashboard/bookings-trend - Get bookings trend for charts
router.get('/bookings-trend', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        
        // Calculate start date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        const startDateStr = startDate.toISOString().split('T')[0];

        // Fetch all bookings in date range in ONE query
        const { data, error } = await supabase
            .from('bookings')
            .select('booking_date')
            .gte('booking_date', startDateStr);

        if (error) throw error;

        // Count bookings per day
        const countsByDate = {};
        (data || []).forEach(booking => {
            const dateStr = booking.booking_date.split('T')[0];
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
        });

        // Generate labels and values for last N days
        const labels = [];
        const values = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const label = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            labels.push(label);
            values.push(countsByDate[dateStr] || 0);
        }

        res.json({
            success: true,
            data: {
                labels: labels,
                values: values
            }
        });
    } catch (error) {
        console.error('Error fetching bookings trend:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings trend',
            message: error.message
        });
    }
});

// GET /api/dashboard/company-distribution - Get company-wise booking distribution
router.get('/company-distribution', async (req, res) => {
    try {
        // Use aggregation to count in database instead of fetching all records
        const { data, error } = await supabase
            .from('bookings')
            .select('company_id, company:companies(name)');

        if (error) throw error;

        // Count bookings per company
        const distribution = {};
        (data || []).forEach(booking => {
            const companyName = booking.company?.name || 'Unknown';
            distribution[companyName] = (distribution[companyName] || 0) + 1;
        });

        // Sort companies by booking count and limit to top 5
        const sortedCompanies = Object.entries(distribution)
            .sort((a, b) => b[1] - a[1]);

        let labels = [];
        let values = [];

        if (sortedCompanies.length <= 5) {
            // If 5 or fewer companies, show all
            labels = sortedCompanies.map(([name]) => name);
            values = sortedCompanies.map(([, count]) => count);
        } else {
            // Show top 5 and group rest as "Others"
            const top5 = sortedCompanies.slice(0, 5);
            const others = sortedCompanies.slice(5);
            const othersCount = others.reduce((sum, [, count]) => sum + count, 0);

            labels = [...top5.map(([name]) => name), 'Others'];
            values = [...top5.map(([, count]) => count), othersCount];
        }

        res.json({
            success: true,
            data: {
                labels: labels,
                values: values
            }
        });
    } catch (error) {
        console.error('Error fetching company distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company distribution',
            message: error.message
        });
    }
});

// GET /api/dashboard/summary - Get complete dashboard summary with growth rates
router.get('/summary', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Fetch all data in parallel
        const [
            todayBookingsResult,
            yesterdayBookingsResult,
            totalBookingsResult,
            totalBookingsYesterdayResult,
            dispatchedVehiclesResult,
            dispatchedVehiclesYesterdayResult,
            pendingDeliveriesResult,
            pendingDeliveriesYesterdayResult,
            recentBookingsResult,
            allBookingsForTrend,
            allBookingsForDistribution,
            todayStatusBookedResult,
            todayStatusInTransitResult,
            todayStatusDeliveredResult
        ] = await Promise.all([
            // Today's bookings
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .gte('booking_date', today),
            
            // Yesterday's bookings
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .gte('booking_date', yesterday)
                .lt('booking_date', today),
            
            // Total bookings
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true }),
            
            // Total bookings yesterday
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .lt('booking_date', today),
            
            // Dispatched vehicles
            supabase
                .from('vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Dispatched'),
            
            // Dispatched vehicles yesterday
            supabase
                .from('vehicles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Dispatched')
                .lt('updated_at', today),
            
            // Pending deliveries (IN-TRANSIT)
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'IN-TRANSIT'),
            
            // Pending deliveries yesterday
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'IN-TRANSIT')
                .lt('updated_at', today),
            
            // Recent 10 bookings
            supabase
                .from('bookings')
                .select(`
                    *,
                    company:companies(name, phone),
                    vehicle:vehicles(registration_number, vehicle_type),
                    driver:drivers(name, phone)
                `)
                .order('booking_date', { ascending: false })
                .limit(10),
            
            // All bookings for trend (last 7 days)
            supabase
                .from('bookings')
                .select('booking_date')
                .gte('booking_date', new Date(Date.now() - 7 * 86400000).toISOString()),
            
            // All bookings for company distribution
            supabase
                .from('bookings')
                .select('company_id, company:companies(name)'),
            
            // Today's status overview - BOOKED
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'BOOKED')
                .gte('booking_date', today),
            
            // Today's status overview - IN-TRANSIT
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'IN-TRANSIT')
                .gte('booking_date', today),
            
            // Today's status overview - DELIVERED
            supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'DELIVERED')
                .gte('booking_date', today)
        ]);

        // Calculate growth rates
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // Process trend data for current week (Sunday to Saturday)
        const countsByDate = {};
        if (allBookingsForTrend.data) {
            allBookingsForTrend.data.forEach(booking => {
                const dateStr = booking.booking_date.split('T')[0];
                countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
            });
        }

        // Generate labels and values for current week (Sunday to Saturday)
        const trendLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const trendCounts = [0, 0, 0, 0, 0, 0, 0];
        
        // Map bookings to their day of week
        if (allBookingsForTrend.data) {
            allBookingsForTrend.data.forEach(booking => {
                const date = new Date(booking.booking_date);
                const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                trendCounts[dayIndex]++;
            });
        }

        // Process company distribution
        const distribution = {};
        if (allBookingsForDistribution.data) {
            allBookingsForDistribution.data.forEach(booking => {
                const companyName = booking.company?.name || 'Unknown';
                distribution[companyName] = (distribution[companyName] || 0) + 1;
            });
        }

        // Sort companies by booking count and limit to top 5
        const sortedCompanies = Object.entries(distribution)
            .sort((a, b) => b[1] - a[1]);

        let companyLabels = [];
        let companyValues = [];

        if (sortedCompanies.length <= 5) {
            // If 5 or fewer companies, show all
            companyLabels = sortedCompanies.map(([name]) => name);
            companyValues = sortedCompanies.map(([, count]) => count);
        } else {
            // Show top 5 and group rest as "Others"
            const top5 = sortedCompanies.slice(0, 5);
            const others = sortedCompanies.slice(5);
            const othersCount = others.reduce((sum, [, count]) => sum + count, 0);

            companyLabels = [...top5.map(([name]) => name), 'Others'];
            companyValues = [...top5.map(([, count]) => count), othersCount];
        }

        // Get active vehicles (Available or Dispatched)
        const activeVehiclesResult = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Available', 'Dispatched']);

        const activeVehiclesYesterdayResult = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Available', 'Dispatched'])
            .lt('updated_at', today);

        // Get parcels in transit
        const transitBookingsResult = await supabase
            .from('bookings')
            .select('article_count')
            .eq('status', 'IN-TRANSIT');

        const transitBookingsYesterdayResult = await supabase
            .from('bookings')
            .select('article_count')
            .eq('status', 'IN-TRANSIT')
            .lt('updated_at', today);

        const parcelsInTransit = (transitBookingsResult.data || []).reduce((sum, b) => sum + (b.article_count || 0), 0);
        const parcelsInTransitYesterday = (transitBookingsYesterdayResult.data || []).reduce((sum, b) => sum + (b.article_count || 0), 0);

        res.json({
            success: true,
            data: {
                stats: {
                    todayBookings: todayBookingsResult.count || 0,
                    todayBookingsGrowth: calculateGrowth(todayBookingsResult.count || 0, yesterdayBookingsResult.count || 0),
                    activeVehicles: activeVehiclesResult.count || 0,
                    activeVehiclesGrowth: calculateGrowth(activeVehiclesResult.count || 0, activeVehiclesYesterdayResult.count || 0),
                    parcelsInTransit: parcelsInTransit || 0,
                    parcelsInTransitGrowth: calculateGrowth(parcelsInTransit || 0, parcelsInTransitYesterday || 0),
                    pendingDeliveries: pendingDeliveriesResult.count || 0,
                    pendingDeliveriesGrowth: calculateGrowth(pendingDeliveriesResult.count || 0, pendingDeliveriesYesterdayResult.count || 0)
                },
                statusOverview: {
                    booked: todayStatusBookedResult.count || 0,
                    inTransit: todayStatusInTransitResult.count || 0,
                    delivered: todayStatusDeliveredResult.count || 0
                },
                recentBookings: recentBookingsResult.data || [],
                trend: {
                    labels: trendLabels,
                    values: trendCounts
                },
                companyDistribution: {
                    labels: companyLabels,
                    values: companyValues
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard summary',
            message: error.message
        });
    }
});

module.exports = router;
