// Reports Page JavaScript

let revenueChart, pieChart, barChart;

async function initReportsPage() {
    console.log('📊 Initializing Reports page...');
    
    // Set default dates - use wide range to capture all data
    const today = new Date();
    today.setFullYear(today.getFullYear() + 1); // Include future dates
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    document.getElementById('repFrom').value = oneYearAgo.toISOString().split('T')[0];
    document.getElementById('repTo').value = today.toISOString().split('T')[0];
    
    // Load companies for filter
    await loadCompaniesFilter();
    
    // Generate initial report
    await generateReport();
    
    // Event listeners
    document.getElementById('repGenerateBtn').addEventListener('click', generateReport);
    document.getElementById('repResetBtn').addEventListener('click', resetFilters);
    document.getElementById('repExportPdfBtn').addEventListener('click', exportPDF);
    document.getElementById('repExportCsvBtn').addEventListener('click', exportCSV);
}

async function loadCompaniesFilter() {
    try {
        const response = await fetch(`${API_BASE_URL}/companies`);
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('reportCompany');
            select.innerHTML = '<option value="All">All Companies</option>';
            
            result.data.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

async function generateReport() {
    const dateFrom = document.getElementById('repFrom').value;
    const dateTo = document.getElementById('repTo').value;
    const companyId = document.getElementById('reportCompany').value;
    
    const params = new URLSearchParams({ dateFrom, dateTo, companyId });
    
    try {
        // Load all report data
        await Promise.all([
            loadSummary(params),
            loadRevenueTrend(params),
            loadCompanySummary(params),
            loadParcelTypeDistribution(params),
            loadVehicleDispatch(params)
        ]);
    } catch (error) {
        console.error('Error generating report:', error);
    }
}

async function loadSummary(params) {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/summary?${params}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            document.getElementById('repRevenue').textContent = `₹${parseFloat(data.totalRevenue).toLocaleString('en-IN')}`;
            document.getElementById('repBookings').textContent = data.totalBookings;
            document.getElementById('repDispatches').textContent = data.totalDispatches;
            document.getElementById('repAvg').textContent = `₹${parseFloat(data.avgRevenuePerBooking).toLocaleString('en-IN')}`;
        }
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

async function loadRevenueTrend(params) {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/revenue-trend?${params}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Destroy existing chart
            if (revenueChart) {
                revenueChart.destroy();
            }
            
            // Create new chart
            const ctx = document.getElementById('repRevenueChart').getContext('2d');
            revenueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => d.month),
                    datasets: [{
                        label: 'Revenue',
                        data: data.map(d => parseFloat(d.revenue)),
                        borderColor: '#111827',
                        backgroundColor: 'rgba(17, 24, 39, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => '₹' + value.toLocaleString('en-IN')
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading revenue trend:', error);
    }
}

async function loadCompanySummary(params) {
    try {
        console.log('📊 Loading company summary...');
        const response = await fetch(`${API_BASE_URL}/reports/company-summary?${params}`);
        const result = await response.json();
        
        console.log('Company summary result:', result);
        
        if (result.success) {
            const tbody = document.getElementById('repCompanyBody');
            
            if (!tbody) {
                console.error('❌ repCompanyBody element not found!');
                return;
            }
            
            if (result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#9ca3af;">No data available</td></tr>';
                return;
            }
            
            tbody.innerHTML = result.data.map(row => `
                <tr>
                    <td>${row.company}</td>
                    <td>₹${parseFloat(row.totalRevenue).toLocaleString('en-IN')}</td>
                    <td>${row.totalBookings}</td>
                    <td>₹${parseFloat(row.avgPerBooking).toLocaleString('en-IN')}</td>
                </tr>
            `).join('');
            
            console.log('✅ Company summary table updated');
        }
    } catch (error) {
        console.error('❌ Error loading company summary:', error);
    }
}

async function loadParcelTypeDistribution(params) {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/parcel-type-distribution?${params}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Update table
            const tbody = document.getElementById('repParcelBody');
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#9ca3af;">No data available</td></tr>';
            } else {
                tbody.innerHTML = data.map(row => `
                    <tr>
                        <td>${row.type}</td>
                        <td>${row.count}</td>
                        <td>${row.percentage}%</td>
                        <td>
                            <div style="background:#e5e7eb; height:8px; border-radius:4px; overflow:hidden;">
                                <div style="background:#111827; height:100%; width:${row.percentage}%;"></div>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            
            // Update pie chart
            if (pieChart) {
                pieChart.destroy();
            }
            
            const ctx = document.getElementById('repPieChart').getContext('2d');
            pieChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.type),
                    datasets: [{
                        data: data.map(d => d.count),
                        backgroundColor: ['#111827', '#6b7280', '#9ca3af', '#d1d5db']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading parcel type distribution:', error);
    }
}

async function loadVehicleDispatch(params) {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/vehicle-dispatch?${params}`);
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            if (barChart) {
                barChart.destroy();
            }
            
            const ctx = document.getElementById('repBarChart').getContext('2d');
            barChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.vehicle),
                    datasets: [{
                        label: 'Dispatches',
                        data: data.map(d => d.count),
                        backgroundColor: '#111827'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading vehicle dispatch:', error);
    }
}

function resetFilters() {
    const today = new Date();
    today.setFullYear(today.getFullYear() + 1); // Include future dates
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    document.getElementById('repFrom').value = oneYearAgo.toISOString().split('T')[0];
    document.getElementById('repTo').value = today.toISOString().split('T')[0];
    document.getElementById('reportCompany').value = 'All';
    
    generateReport();
}

function exportPDF() {
    alert('PDF export functionality will be implemented');
}

function exportCSV() {
    alert('CSV export functionality will be implemented');
}
