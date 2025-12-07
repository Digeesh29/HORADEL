// GLOBAL STATE (same data you had before)
const bookings = [
    { lr: "LR-2024-001", date: "2024-12-01", company: "TechCorp",     consignee: "ABC Company",  dest: "Andheri, Mumbai", articles: 25, type: "Standard", status: "Dispatched", assignedTo: "MH-12-AB-1234" },
    { lr: "LR-2024-002", date: "2024-12-01", company: "GlobalTrade",  consignee: "PQR Ltd",      dest: "Pune",           articles: 35, type: "Express",  status: "Assigned",   assignedTo: "MH-14-CD-5678" },
    { lr: "LR-2024-003", date: "2024-12-01", company: "FastShip",     consignee: "MNO Inc",      dest: "Bangalore",      articles: 28, type: "Standard", status: "Verified",   assignedTo: null },
    { lr: "LR-2024-004", date: "2024-12-01", company: "QuickMove",    consignee: "DEF Solutions",dest: "Delhi",          articles: 22, type: "Standard", status: "Submitted",  assignedTo: null },
    { lr: "LR-2024-005", date: "2024-12-01", company: "EasyLogistics",consignee: "GHI Enterprises",dest:"Chennai",       articles: 18, type: "Express",  status: "Dispatched", assignedTo: "TN-09-EF-9012" }
];

const vehicles = [
    { no: "MH-12-AB-1234", driver: "Rajesh Kumar", contact: "9876543210", capacity: "5 Tons", status: "Dispatched" },
    { no: "MH-14-CD-5678", driver: "Amit Sharma",  contact: "9123456789", capacity: "3 Tons", status: "Assigned"   },
    { no: "TN-09-EF-9012", driver: "Suresh Menon", contact: "9988776655", capacity: "7 Tons", status: "Dispatched" },
    { no: "KA-05-GH-3456", driver: "Vikas Reddy",  contact: "9876543213", capacity: "5 Tons", status: "Pending"    },
    { no: "DL-07-IJ-7890", driver: "Manoj Singh",  contact: "9876543214", capacity: "4 Tons", status: "Pending"    }
];

const rateCards = [
    { company: "TechCorp",      base: 500, perArticle: 10, parcelType: 50, zoneRate: 100, updated: "2024-12-01" },
    { company: "GlobalTrade",   base: 450, perArticle: 12, parcelType: 40, zoneRate: 90,  updated: "2024-11-28" },
    { company: "FastShip",      base: 600, perArticle: 15, parcelType: 60, zoneRate: 120, updated: "2024-12-02" },
    { company: "QuickMove",     base: 550, perArticle: 11, parcelType: 45, zoneRate: 110, updated: "2024-11-30" },
    { company: "EasyLogistics", base: 480, perArticle: 10, parcelType: 40, zoneRate: 95,  updated: "2024-12-03" }
];

let activeLr = null;

// Simple toast
function showToast(msg, type = "success", duration = 2500) {
    const el = document.createElement("div");
    const bg = type === "success" ? "#10b981" : type === "info" ? "#3b82f6" : "#ef4444";
    el.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      background:${bg};color:white;padding:10px 14px;border-radius:8px;
      font-size:14px;font-family:Inter,system-ui;
      box-shadow:0 10px 15px -3px rgba(0,0,0,.2);
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "0.2s"; }, duration);
    setTimeout(() => el.remove(), duration + 200);
}

// Export CSV (Reports → Excel)
function exportCSV() {
    const headers = ["LR,Company,Consignee,Destination,Status,Vehicle"];
    const rows = bookings.map(b =>
        `${b.lr},${b.company},${b.consignee},${b.dest},${b.status},${b.assignedTo || ""}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "transport_report.csv";
    link.click();
}

// Global manifest printer
function printBookingPDF(booking) {
    const w = window.open("", "_blank", "height=600,width=800");
    if (!w) return alert("Enable popups to print");

    w.document.write(`
        <html><head><title>Manifest - ${booking.lr}</title>
        <style>
            body{font-family:Arial;padding:40px;}
            h1{margin-bottom:10px;}
            table{width:100%;border-collapse:collapse;margin-top:20px;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;}
        </style>
        </head><body>
        <h1>HoraDel Transport</h1>
        <p><b>LR:</b> ${booking.lr}</p>
        <p><b>Date:</b> ${booking.date}</p>
        <p><b>Company:</b> ${booking.company}</p>
        <p><b>Consignee:</b> ${booking.consignee}</p>
        <p><b>Destination:</b> ${booking.dest}</p>

        <table>
            <thead><tr><th>Description</th><th>Type</th><th>Qty</th></tr></thead>
            <tbody><tr><td>Logistics Service</td><td>${booking.type}</td><td>${booking.articles}</td></tr></tbody>
        </table>
        <script>window.onload=function(){window.print();}</script>
        </body></html>
    `);
    w.document.close();
}

// Open side drawer with LR details (used by bookings & dashboard)
function openSlideoverForLR(lr) {
    const b = bookings.find(x => x.lr === lr);
    if (!b) return;
    activeLr = b;
    alert(
        `LR: ${b.lr}\nCompany: ${b.company}\nConsignee: ${b.consignee}\nDestination: ${b.dest}\nArticles: ${b.articles}\nStatus: ${b.status}`
    );
}

// NAV + PAGE LOADING
document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");

    function loadPage(page) {
        fetch(`pages/${page}.html`)
            .then(r => r.text())
            .then(html => {
                content.innerHTML = html;

                // Call page-specific init function
                if (page === "dashboard") initDashboardPage();
                if (page === "bookings") initBookingsPage();
                if (page === "vehicles") initVehiclesPage();
                if (page === "ratecard") initRateCardPage();
                if (page === "reports") initReportsPage();
            });
    }

    // Sidebar click
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const page = btn.getAttribute("data-page");
            loadPage(page);

            const title = page === "ratecard" ? "Rate Card" :
                          page.charAt(0).toUpperCase() + page.slice(1);
            document.getElementById("pageTitle").innerText = title;
        });
    });

    // Load default page
    loadPage("dashboard");
});
