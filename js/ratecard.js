// js/ratecard.js

document.addEventListener("DOMContentLoaded", () => {
    // ---------- SAMPLE DATA (initial rows) ----------
    let rateCards = [
        { company: "TechCorp",      base: 500, perArticle: 15, parcelType: 25, zoneRate: 100, updated: "2024-12-01" },
        { company: "GlobalTrade",   base: 450, perArticle: 12, parcelType: 20, zoneRate:  90, updated: "2024-11-28" },
        { company: "FastShip",      base: 600, perArticle: 18, parcelType: 30, zoneRate: 120, updated: "2024-12-02" },
        { company: "QuickMove",     base: 550, perArticle: 16, parcelType: 28, zoneRate: 110, updated: "2024-11-30" },
        { company: "EasyLogistics", base: 480, perArticle: 14, parcelType: 22, zoneRate:  95, updated: "2024-12-03" }
    ];

    // ---------- HELPERS ----------
    const tbody = document.getElementById("rateCardTableBody");
    const exportBtn = document.getElementById("exportRatePdfBtn");
    const openModalBtn = document.getElementById("openRateModal");
    const rateModal = document.getElementById("rateModal");
    const closeModalBtn = document.getElementById("closeRateModal");
    const cancelModalBtn = document.getElementById("cancelRateModal");
    const saveRateBtn = document.getElementById("saveRateCard");
    const modalTitle = document.getElementById("rateModalTitle");

    const rCompany    = document.getElementById("rCompany");
    const rBase       = document.getElementById("rBase");
    const rPerArticle = document.getElementById("rPerArticle");
    const rTypePrice  = document.getElementById("rTypePrice");
    const rZonePrice  = document.getElementById("rZonePrice");

    let editingCompany = null; // null = new, string = existing company name

    function formatRs(v) {
        return "₹" + v.toString();
    }

    // ---------- RENDER TABLE ----------
    function renderRateCards() {
        if (!tbody) return;

        tbody.innerHTML = rateCards.map(card => `
            <tr>
                <td style="font-weight:500;">${card.company}</td>
                <td>${formatRs(card.base)}</td>
                <td>${formatRs(card.perArticle)}</td>
                <td>${formatRs(card.parcelType)}</td>
                <td>${formatRs(card.zoneRate)}</td>
                <td style="font-size:13px; color:#6b7280;">${card.updated}</td>
                <td>
                    <button 
                        class="btn btn-outline btn-sm js-edit-rate" 
                        data-company="${card.company}"
                        style="padding:4px 10px; font-size:12px; display:flex; align-items:center; gap:4px;"
                    >
                        <span class="material-symbols-outlined" style="font-size:14px;">edit</span>
                        Edit Rate Card
                    </button>
                </td>
            </tr>
        `).join("");
    }

    // ---------- MODAL OPEN / CLOSE ----------
    function openModal(editCompanyName) {
        editingCompany = editCompanyName || null;

        if (editingCompany) {
            const card = rateCards.find(r => r.company === editingCompany);
            if (card) {
                modalTitle.textContent = "Edit Rate Card";
                rCompany.value    = card.company;
                rBase.value       = card.base;
                rPerArticle.value = card.perArticle;
                rTypePrice.value  = card.parcelType;
                rZonePrice.value  = card.zoneRate;
            }
        } else {
            modalTitle.textContent = "Add New Rate Card";
            rCompany.value    = "";
            rBase.value       = "";
            rPerArticle.value = "";
            rTypePrice.value  = "";
            rZonePrice.value  = "";
        }

        rateModal.style.display = "flex";
    }

    function closeModal() {
        rateModal.style.display = "none";
        editingCompany = null;
    }

    // ---------- SAVE RATE CARD ----------
    function saveRateCard() {
        const company = rCompany.value.trim();
        const base    = parseInt(rBase.value, 10) || 0;
        const perArt  = parseInt(rPerArticle.value, 10) || 0;
        const typeP   = parseInt(rTypePrice.value, 10) || 0;
        const zoneP   = parseInt(rZonePrice.value, 10) || 0;

        if (!company || !base) {
            alert("Please enter at least Company Name and Base Rate.");
            return;
        }

        const today = new Date().toISOString().split("T")[0];

        const newEntry = {
            company,
            base,
            perArticle: perArt,
            parcelType: typeP,
            zoneRate: zoneP,
            updated: today
        };

        const idx = rateCards.findIndex(r => r.company === company);

        if (idx > -1) {
            // Update
            rateCards[idx] = newEntry;
        } else {
            // New
            rateCards.push(newEntry);
        }

        renderRateCards();
        closeModal();
    }

    // ---------- EXPORT PDF (simple print view) ----------
    function exportRateCardsPDF() {
        const win = window.open("", "_blank", "width=1000,height=700");
        if (!win) {
            alert("Please allow pop-ups to export the PDF.");
            return;
        }

        const rowsHtml = rateCards.map(c => `
            <tr>
                <td>${c.company}</td>
                <td>${formatRs(c.base)}</td>
                <td>${formatRs(c.perArticle)}</td>
                <td>${formatRs(c.parcelType)}</td>
                <td>${formatRs(c.zoneRate)}</td>
                <td>${c.updated}</td>
            </tr>
        `).join("");

        win.document.write(`
            <html>
            <head>
                <title>Rate Card - HoraDel Transport</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 32px; color:#111827; }
                    h1   { font-size: 20px; margin-bottom: 4px; }
                    p    { font-size: 12px; color:#6b7280; margin-bottom: 16px; }
                    table { width:100%; border-collapse:collapse; margin-top:16px; }
                    th, td { border:1px solid #e5e7eb; padding:8px 10px; font-size:12px; text-align:left; }
                    th { background:#f9fafb; }
                </style>
            </head>
            <body>
                <h1>Rate Card</h1>
                <p>Generated from HoraDel Admin Panel</p>

                <table>
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Base Rate</th>
                            <th>Per Article Rate</th>
                            <th>Parcel Type Extra</th>
                            <th>Zone/City Rate</th>
                            <th>Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <script>
                    window.onload = function () { window.print(); };
                <\/script>
            </body>
            </html>
        `);

        win.document.close();
    }

    // ---------- EVENT BINDINGS ----------
    // Initial render
    renderRateCards();

    // Open modal (Add)
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => openModal(null));
    }

    // Close modal buttons
    if (closeModalBtn)  closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    // Save
    if (saveRateBtn) saveRateBtn.addEventListener("click", saveRateCard);

    // Edit buttons (event delegation)
    document.body.addEventListener("click", (e) => {
        const btn = e.target.closest(".js-edit-rate");
        if (!btn) return;

        const company = btn.dataset.company;
        openModal(company);
    });

    // Export PDF
    if (exportBtn) {
        exportBtn.addEventListener("click", exportRateCardsPDF);
    }
});
