// REPORTS PAGE LOGIC

// Sample data (same style as dashboard)
const repBookings = [
    { lr: "LR-2024-001", date: "2024-01-15", company: "TechCorp",      type: "Standard", parcelType: "Standard", articles: 25, status: "Dispatched", revenue: 520 },
    { lr: "LR-2024-002", date: "2024-01-18", company: "GlobalTrade",   type: "Express",  parcelType: "Express",  articles: 35, status: "Dispatched", revenue: 650 },
    { lr: "LR-2024-003", date: "2024-02-03", company: "FastShip",      type: "Standard", parcelType: "Heavy",    articles: 28, status: "Verified",   revenue: 730 },
    { lr: "LR-2024-004", date: "2024-03-10", company: "QuickMove",     type: "Standard", parcelType: "Standard", articles: 22, status: "Submitted",  revenue: 480 },
    { lr: "LR-2024-005", date: "2024-03-22", company: "EasyLogistics", type: "Express",  parcelType: "Fragile",  articles: 18, status: "Dispatched", revenue: 540 },
    // add more to better see charts
    { lr: "LR-2024-006", date: "2024-04-05", company: "TechCorp",      type: "Express",  parcelType: "Standard", articles: 30, status: "Dispatched", revenue: 780 },
    { lr: "LR-2024-007", date: "2024-04-18", company: "GlobalTrade",   type: "Standard", parcelType: "Heavy",    articles: 20, status: "Verified",   revenue: 620 },
    { lr: "LR-2024-008", date: "2024-05-02", company: "FastShip",      type: "Express",  parcelType: "Express",  articles: 26, status: "Dispatched", revenue: 810 },
    { lr: "LR-2024-009", date: "2024-05-19", company: "QuickMove",     type: "Standard", parcelType: "Fragile",  articles: 24, status: "Dispatched", revenue: 560 },
    { lr: "LR-2024-010", date: "2024-06-01", company: "EasyLogistics", type: "Standard", parcelType: "Standard", articles: 21, status: "Dispatched", revenue: 510 },
];

const repVehicles = [
    { no: "MH-12-AB-1234", status: "Dispatched" },
    { no: "MH-14-CD-5678", status: "Dispatched" },
    { no: "TN-09-EF-9012", status: "Dispatched" },
    { no: "KA-05-GH-3456", status: "Pending" },
    { no: "DL-07-IJ-7890", status: "Pending" }
];

let repRevenueChartInstance   = null;
let repPieChartInstance       = null;
let repBarChartInstance       = null;

document.addEventListener("DOMContentLoaded", () => {
    // Only run on reports page
    if (!document.getElementById("repRevenue")) return;

    initReportsPage();
});

function toastRep(message, type = "success") {
    if (typeof showToast === "function") {
        showToast(message, type, 2200);
    } else {
        console.log(message);
    }
}

function initReportsPage() {
    wireReportEvents();
    generateReport();  // initial
}

/* -------- events -------- */

function wireReportEvents() {
    const genBtn   = document.getElementById("repGenerateBtn");
    const resetBtn = document.getElementById("repResetBtn");
    const pdfBtn   = document.getElementById("repExportPdfBtn");
    const csvBtn   = document.getElementById("repExportCsvBtn");
    const companySelect = document.getElementById("reportCompany");

    if (genBtn)   genBtn.addEventListener("click", generateReport);
    if (resetBtn) resetBtn.addEventListener("click", () => {
        document.getElementById("repFrom").value = "2024-01-01";
        document.getElementById("repTo").value   = "2024-12-01";
        companySelect.value = "All";
        generateReport();
    });
    if (companySelect) companySelect.addEventListener("change", generateReport);

    if (pdfBtn) pdfBtn.addEventListener("click", () => {
        toastRep("📄 Opening print dialog…", "info");
        setTimeout(() => window.print(), 300);
    });

    if (csvBtn) csvBtn.addEventListener("click", exportReportCSV);
}

/* -------- main reporting logic -------- */

function generateReport() {
    const from = document.getElementById("repFrom").value || "2024-01-01";
    const to   = document.getElementById("repTo").value   || "2024-12-31";
    const company = document.getElementById("reportCompany").value || "All";

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    const filtered = repBookings.filter(b => {
        const d = new Date(b.date);
        const inRange = d >= fromDate && d <= toDate;
        const compOk  = company === "All" || b.company === company;
        return inRange && compOk;
    });

    renderKpis(filtered);
    renderCompanySummary(filtered);
    renderParcelSummary(filtered);
    renderCharts(filtered);
}

function renderKpis(data) {
    const totalRevenue = data.reduce((sum, b) => sum + (b.revenue || 0), 0);
    const totalBookings = data.length;
    const totalDispatches = repVehicles.filter(v => v.status === "Dispatched").length;
    const avgRevenue = totalBookings ? Math.round(totalRevenue / totalBookings) : 0;

    document.getElementById("repRevenue").innerText    = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById("repBookings").innerText   = totalBookings;
    document.getElementById("repDispatches").innerText = totalDispatches;
    document.getElementById("repAvg").innerText        = `₹${avgRevenue}`;
}

/* -------- tables -------- */

function renderCompanySummary(data) {
    const tbody = document.getElementById("repCompanyBody");
    if (!tbody) return;

    const groups = {};
    data.forEach(b => {
        if (!groups[b.company]) groups[b.company] = { rev: 0, count: 0 };
        groups[b.company].rev   += b.revenue || 0;
        groups[b.company].count += 1;
    });

    const rows = Object.keys(groups).map(name => {
        const g = groups[name];
        const avg = g.count ? Math.round(g.rev / g.count) : 0;
        return `
            <tr>
                <td style="font-weight:500;">${name}</td>
                <td>₹${g.rev.toLocaleString()}</td>
                <td>${g.count}</td>
                <td>₹${avg}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join("") || `
        <tr><td colspan="4" style="text-align:center; color:#9ca3af; font-size:13px;">No data in this range.</td></tr>
    `;
}

function renderParcelSummary(data) {
    const tbody = document.getElementById("repParcelBody");
    if (!tbody) return;

    const counts = {};
    data.forEach(b => {
        const t = b.parcelType || "Standard";
        counts[t] = (counts[t] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const rows = Object.keys(counts).map(type => {
        const count = counts[type];
        const pct = total ? Math.round((count / total) * 100) : 0;
        return `
            <tr>
                <td style="font-weight:500;">${type}</td>
                <td>${count}</td>
                <td>${pct}%</td>
                <td>
                    <div style="height:6px; background:#e5e7eb; border-radius:999px; overflow:hidden;">
                        <div style="height:6px; width:${pct}%; background:#2563eb;"></div>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join("") || `
        <tr><td colspan="4" style="text-align:center; color:#9ca3af; font-size:13px;">No parcel data.</td></tr>
    `;
}

/* -------- charts -------- */

function renderCharts(data) {
    // Revenue trend by month (Jan–Jun)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const monthTotals = [0,0,0,0,0,0];
    data.forEach(b => {
        const m = new Date(b.date).getMonth();  // 0–11
        if (m >= 0 && m <= 5) monthTotals[m] += b.revenue || 0;
    });

    const revenueCtx = document.getElementById("repRevenueChart");
    if (revenueCtx) {
        if (repRevenueChartInstance) repRevenueChartInstance.destroy();
        repRevenueChartInstance = new Chart(revenueCtx, {
            type: "line",
            data: {
                labels: months,
                datasets: [{
                    label: "Revenue",
                    data: monthTotals,
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37, 99, 235, 0.15)",
                    tension: 0.35,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Parcel type pie
    const counts = {};
    data.forEach(b => {
        const t = b.parcelType || "Standard";
        counts[t] = (counts[t] || 0) + 1;
    });

    const types = Object.keys(counts);
    const values = Object.values(counts);

    const pieCtx = document.getElementById("repPieChart");
    if (pieCtx) {
        if (repPieChartInstance) repPieChartInstance.destroy();
        repPieChartInstance = new Chart(pieCtx, {
            type: "doughnut",
            data: {
                labels: types,
                datasets: [{
                    data: values,
                    backgroundColor: ["#2563eb", "#10b981", "#f97316", "#facc15"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: { legend: { position: "bottom" } }
            }
        });
    }

    // Vehicle dispatch bar (Mon–Sun – static example)
    const barCtx = document.getElementById("repBarChart");
    if (barCtx) {
        if (repBarChartInstance) repBarChartInstance.destroy();
        repBarChartInstance = new Chart(barCtx, {
            type: "bar",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Dispatches",
                    data: [12,15,11,18,14,9,10],
                    backgroundColor: "#2563eb",
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

/* -------- CSV export -------- */

function exportReportCSV() {
    if (!repBookings.length) {
        alert("No data to export.");
        return;
    }

    const headers = ["LR No","Date","Company","Type","Parcel Type","Articles","Status","Revenue"];
    const rows = repBookings.map(b => [
        b.lr, b.date, b.company, b.type, b.parcelType, b.articles, b.status, b.revenue
    ]);

    const csvLines = [headers.join(","), ...rows.map(r => r.join(","))];
    const csvContent = "data:text/csv;charset=utf-8," + csvLines.join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "horaDel_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
