function initBookingsPage() {
    const companySelect = document.getElementById("bookingsCompany");
    const statusSelect  = document.getElementById("bookingsStatus");
    const searchInput   = document.getElementById("bookingSearch");
    const filterBtn     = document.getElementById("bookingsFilterBtn");
    const tbody         = document.getElementById("bookingsTableBody");

    // Fill companies dropdown
    const companies = [...new Set(bookings.map(b => b.company))].sort();
    companies.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        companySelect.appendChild(opt);
    });

    function getStatusClass(status) {
        switch (status) {
            case "Dispatched": return "st-dispatched";
            case "Assigned":   return "st-assigned";
            case "Verified":   return "st-verified";
            case "Submitted":  return "st-submitted";
            case "Pending":    return "st-pending";
            default:           return "st-pending";
        }
    }

    function render() {
        const co = companySelect.value;
        const st = statusSelect.value;
        const q  = searchInput.value.trim().toLowerCase();

        const filtered = bookings.filter(b => {
            if (co !== "All" && b.company !== co) return false;
            if (st !== "All" && b.status !== st) return false;
            if (q && !b.lr.toLowerCase().includes(q)) return false;
            return true;
        });

        tbody.innerHTML = filtered.map(b => {
            const badgeClass = getStatusClass(b.status);
            const vehicleDisplay = b.assignedTo
                ? b.assignedTo
                : '<span style="color:#9ca3af">Unassigned</span>';

            return `
                <tr>
                    <td style="font-weight:500;">${b.lr}</td>
                    <td>${b.date}</td>
                    <td>${b.company}</td>
                    <td>${b.consignee}</td>
                    <td>${b.dest}</td>
                    <td>${b.articles}</td>
                    <td>${b.type}</td>
                    <td>${vehicleDisplay}</td>
                    <td>
                        <span class="status-badge ${badgeClass}">${b.status}</span>
                    </td>
                    <td>
                        <button class="view-btn-icon" onclick="openSlideoverForLR('${b.lr}')">
                            <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
                        </button>
                        <button class="view-btn-icon" onclick='printBookingPDF(${JSON.stringify(b).replace(/"/g, "&quot;")})'>
                            <span class="material-symbols-outlined" style="font-size:18px;">print</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Events
    filterBtn.addEventListener("click", render);
    companySelect.addEventListener("change", render);
    statusSelect.addEventListener("change", render);
    searchInput.addEventListener("keyup", e => { if (e.key === "Enter") render(); });

    // Initial render
    render();
}
