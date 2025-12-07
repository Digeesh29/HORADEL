function initVehiclesPage() {
    const grid = document.getElementById("vehiclesGrid");
    const addBtn = document.getElementById("addVehicleBtn");

    function render() {
        grid.innerHTML = vehicles.map(v => {
            const count = bookings.filter(b => b.assignedTo === v.no).length;
            return `
            <div class="vehicle-card card">
                <div class="v-header">
                    <div style="display:flex; align-items:center;">
                        <div class="v-icon-box"><span class="material-symbols-outlined">local_shipping</span></div>
                        <div class="v-info">
                            <div class="v-reg">${v.no}</div>
                            <div class="v-cap">${v.capacity}</div>
                        </div>
                    </div>
                    <span class="status-badge">${v.status}</span>
                </div>
                <div class="v-divider"></div>
                <div class="v-details">
                    <div class="v-icon-text"><span class="material-symbols-outlined" style="font-size:16px;">person</span> ${v.driver}</div>
                    <div class="v-icon-text"><span class="material-symbols-outlined" style="font-size:16px;">call</span> +91 ${v.contact}</div>
                </div>
                <div class="v-assigned-row">
                    <span>Assigned Parcels</span>
                    <div class="parcel-count-badge">${count}</div>
                </div>
                <div class="v-actions">
                    <button class="btn btn-outline" onclick="alert('Vehicle: ${v.no}\\nDriver: ${v.driver}\\nContact: ${v.contact}')">Details</button>
                    <button class="btn btn-black" onclick="dispatchVehicle('${v.no}')">Dispatch</button>
                </div>
            </div>`;
        }).join("");
    }

    window.dispatchVehicle = function(vno) {
        const v = vehicles.find(x => x.no === vno);
        if (!v) return;
        v.status = "Dispatched";
        bookings.forEach(b => { if (b.assignedTo === vno) b.status = "Dispatched"; });
        showToast(`Vehicle ${vno} dispatched`);
        render();
    };

    addBtn.addEventListener("click", () => {
        const no = prompt("Vehicle No:");
        if (!no) return;
        vehicles.push({
            no,
            driver: "New Driver",
            contact: "0000000000",
            capacity: "4 Tons",
            status: "Pending"
        });
        showToast("Vehicle added", "info");
        render();
    });

    render();
}
