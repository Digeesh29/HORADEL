function initDashboardPage() {
    // === STATS NUMBERS ===
    const totalBookings      = bookings.length;
    const totalBatches       = bookings.length;
    const dispatchedVehicles = vehicles.filter(v => v.status === "Dispatched").length;
    const pendingDeliveries  = bookings.filter(b => b.status !== "Delivered").length;

    document.getElementById("dashBookings").innerText   = totalBookings;
    document.getElementById("dashBatches").innerText    = totalBatches;
    document.getElementById("dashDispatched").innerText = dispatchedVehicles;
    document.getElementById("dashPending").innerText    = pendingDeliveries;

    // === LATEST 10 BOOKINGS TABLE ===
    const tbody = document.getElementById("dashTableBody");

    function statusClass(status) {
        switch (status) {
            case "Dispatched": return "st-dispatched";
            case "Assigned":   return "st-assigned";
            case "Verified":   return "st-verified";
            case "Submitted":  return "st-submitted";
            case "Pending":    return "st-pending";
            default:           return "st-pending";
        }
    }

    tbody.innerHTML = bookings.slice(0, 10).map(b => {
        const badge = statusClass(b.status);
        const vehicle = b.assignedTo
            ? b.assignedTo
            : '<span style="color:#9ca3af">Not Assigned</span>';

        return `
            <tr>
                <td style="font-weight:500;">${b.lr}</td>
                <td>${b.company}</td>
                <td>${b.consignee}</td>
                <td>${b.dest}</td>
                <td>${b.articles}</td>
                <td>${vehicle}</td>
                <td><span class="status-badge ${badge}">${b.status}</span></td>
                <td>
                    <button class="view-btn-icon" onclick="openSlideoverForLR('${b.lr}')">
                        <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
                    </button>
                    <button class="view-btn-icon" onclick='printBookingPDF(${JSON.stringify(b).replace(/"/g,"&quot;")})'>
                        <span class="material-symbols-outlined" style="font-size:18px;">print</span>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    // View all → open Bookings page (if you have nav-item with data-page="bookings")
    const viewAllBtn = document.getElementById("viewAllBookingsBtn");
    if (viewAllBtn) {
        viewAllBtn.addEventListener("click", () => {
            const navBtn = document.querySelector('.nav-item[data-page="bookings"]');
            if (navBtn) navBtn.click();
        });
    }

    // === CHARTS ===
    if (window._dashTrendChart) window._dashTrendChart.destroy();
    if (window._dashLoadChart)  window._dashLoadChart.destroy();

    const trendCtx = document.getElementById("dashTrendChart");
    if (trendCtx) {
        window._dashTrendChart = new Chart(trendCtx, {
            type: "line",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Bookings",
                    data: [45, 52, 48, 61, 55, 38, 42],
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16,185,129,0.08)",
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: "#10b981"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#e5e7eb" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const loadCtx = document.getElementById("dashLoadChart");
    if (loadCtx) {
        const companies = ["TechCorp","GlobalTrade","FastShip","QuickMove","EasyLogistics"];
        const counts = companies.map(c => bookings.filter(b => b.company === c).length);

        window._dashLoadChart = new Chart(loadCtx, {
            type: "bar",
            data: {
                labels: companies,
                datasets: [{
                    label: "Load",
                    data: counts,
                    backgroundColor: "#10b981",
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: "#e5e7eb" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

// if Dashboard is your first page, run on load:
document.addEventListener("DOMContentLoaded", () => {
    // only run if the dashboard page is visible in DOM
    if (document.querySelector("#dashTrendChart")) {
        initDashboardPage();
    }
});
