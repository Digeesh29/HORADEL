// Fetch dashboard data from API
async function initDashboardPage() {
    try {
        // Show loading state
        showLoadingState();

        // Fetch complete dashboard summary from API
        const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        const { stats, recentBookings, trend, companyDistribution, statusOverview } = result.data;

        // === UPDATE STATS NUMBERS ===
        document.getElementById("dashBookings").innerText = stats.todayBookings || 0;
        document.getElementById("dashActiveVehicles").innerText = stats.activeVehicles || 0;
        document.getElementById("dashParcels").innerText = stats.parcelsInTransit || 0;
        document.getElementById("dashPending").innerText = stats.pendingDeliveries || 0;

        // === UPDATE GROWTH RATES ===
        updateGrowthRate("dashBookingsGrowth", stats.todayBookingsGrowth);
        updateGrowthRate("dashActiveVehiclesGrowth", stats.activeVehiclesGrowth);
        updateGrowthRate("dashParcelsGrowth", stats.parcelsInTransitGrowth);
        updateGrowthRate("dashPendingGrowth", stats.pendingDeliveriesGrowth);

        // === UPDATE STATUS OVERVIEW ===
        if (statusOverview) {
            const total = (statusOverview.booked || 0) + (statusOverview.inTransit || 0) + (statusOverview.delivered || 0);
            document.getElementById("statusTotal").innerText = total;
            document.getElementById("statusBooked").innerText = statusOverview.booked || 0;
            document.getElementById("statusInTransit").innerText = statusOverview.inTransit || 0;
            document.getElementById("statusDelivered").innerText = statusOverview.delivered || 0;
        }

        // === RENDER LATEST 10 BOOKINGS TABLE ===
        renderBookingsTable(recentBookings);

        // === RENDER CHARTS ===
        renderTrendChart(trend);
        renderCompanyDistributionChart(companyDistribution);

        // Hide loading state
        hideLoadingState();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showErrorState(error.message);
    }
}

// Update growth rate display
function updateGrowthRate(elementId, growthValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = growthValue >= 0;
    const sign = isPositive ? '+' : '';
    
    element.textContent = `${sign}${growthValue}%`;
    element.className = `stat-change ${isPositive ? 'stat-up' : 'stat-down'}`;
}

// Render bookings table
function renderBookingsTable(bookings) {
    const tbody = document.getElementById("dashTableBody");
    
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#9ca3af;">
                    No bookings found
                </td>
            </tr>
        `;
        return;
    }

    function statusClass(status) {
        switch (status) {
            case "Dispatched": return "st-dispatched";
            case "Assigned":   return "st-assigned";
            case "Verified":   return "st-verified";
            case "Submitted":  return "st-submitted";
            case "Pending":    return "st-pending";
            case "InTransit":  return "st-assigned";
            case "Delivered":  return "st-verified";
            default:           return "st-pending";
        }
    }

    tbody.innerHTML = bookings.map(b => {
        const badge = statusClass(b.status);
        const companyName = b.company?.name || 'N/A';
        const vehicle = b.vehicle?.registration_number
            ? b.vehicle.registration_number
            : '<span style="color:#9ca3af">Not Assigned</span>';

        return `
            <tr>
                <td style="font-weight:500;">${b.lr_number}</td>
                <td>${companyName}</td>
                <td>${b.consignee_name}</td>
                <td>${b.destination}</td>
                <td>${b.article_count}</td>
                <td>${vehicle}</td>
                <td><span class="status-badge ${badge}">${b.status}</span></td>
                <td>
                    <button class="view-btn-icon" onclick="openSlideoverForLR('${b.lr_number}')">
                        <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
                    </button>
                    <button class="view-btn-icon" onclick='printBookingPDF(${JSON.stringify(b).replace(/"/g,"&quot;")})'>
                        <span class="material-symbols-outlined" style="font-size:18px;">print</span>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

}

// Render trend chart
function renderTrendChart(trend) {
    if (window._dashTrendChart) window._dashTrendChart.destroy();

    const trendCtx = document.getElementById("dashTrendChart");
    if (!trendCtx) return;

    window._dashTrendChart = new Chart(trendCtx, {
        type: "line",
        data: {
            labels: trend.labels || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
            datasets: [{
                label: "Bookings",
                data: trend.values || [0, 0, 0, 0, 0, 0, 0],
                borderColor: "#3b82f6",
                backgroundColor: "transparent",
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#3b82f6",
                pointBorderColor: "#3b82f6",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#1f2937',
                    bodyColor: '#6b7280',
                    borderColor: '#e5e7eb',
                    borderWidth: 1
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: "#f3f4f6", drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                },
                x: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                }
            }
        }
    });
}

// Render company distribution chart
function renderCompanyDistributionChart(distribution) {
    if (window._dashLoadChart) window._dashLoadChart.destroy();

    const loadCtx = document.getElementById("dashLoadChart");
    if (!loadCtx) return;

    window._dashLoadChart = new Chart(loadCtx, {
        type: "bar",
        data: {
            labels: distribution.labels || [],
            datasets: [{
                label: "Load",
                data: distribution.values || [],
                backgroundColor: "#10b981",
                borderRadius: 6,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#1f2937',
                    bodyColor: '#6b7280',
                    borderColor: '#e5e7eb',
                    borderWidth: 1
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: "#f3f4f6", drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                },
                x: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                }
            }
        }
    });
}

// Show loading state
function showLoadingState() {
    const statsCards = document.querySelectorAll('.stat-value');
    statsCards.forEach(card => {
        card.innerHTML = '<span style="color:#9ca3af;">...</span>';
    });

    const tbody = document.getElementById("dashTableBody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#9ca3af;">
                    <div style="display:inline-block; animation: spin 1s linear infinite;">⏳</div>
                    Loading dashboard data...
                </td>
            </tr>
        `;
    }
}

// Hide loading state
function hideLoadingState() {
    // Loading state is replaced by actual data
}

// Show error state
function showErrorState(message) {
    const tbody = document.getElementById("dashTableBody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#ef4444;">
                    <div style="margin-bottom:8px;">❌ Error loading dashboard</div>
                    <div style="font-size:13px; color:#9ca3af;">${message}</div>
                    <button onclick="initDashboardPage()" style="margin-top:16px; padding:8px 16px; background:#111827; color:white; border:none; border-radius:6px; cursor:pointer;">
                        Retry
                    </button>
                </td>
            </tr>
        `;
    }

    // Show error toast
    if (typeof showToast === 'function') {
        showToast('Failed to load dashboard data', 'error');
    }
}

// Setup view all bookings button
function setupViewAllButton() {
    const viewAllBtn = document.getElementById("viewAllBookingsBtn");
    if (viewAllBtn) {
        viewAllBtn.addEventListener("click", () => {
            const navBtn = document.querySelector('.nav-item[data-page="bookings"]');
            if (navBtn) navBtn.click();
        });
    }
}

// Add CSS animation for loading spinner
if (!document.getElementById('dashboard-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'dashboard-spinner-style';
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}
