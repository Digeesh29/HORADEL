// Vehicles Page
async function initVehiclesPage() {
    console.log('🚛 Initializing Vehicles Page...');
    
    const grid = document.getElementById("vehiclesGrid");
    const addBtn = document.getElementById("addVehicleBtn");

    if (!grid) {
        console.error('❌ Vehicles grid not found!');
        return;
    }

    // Initialize parcel selection modal
    initParcelSelectionModal();

    // Add Vehicle button handler
    if (addBtn) {
        addBtn.addEventListener('click', openAddVehicleModal);
    }

    // Vehicle details modal close button
    const closeDetailsBtn = document.getElementById('closeVehicleDetailsBtn');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', closeVehicleDetailsModal);
    }

    // Click outside modal to close
    const detailsModal = document.getElementById('vehicleDetailsModal');
    if (detailsModal) {
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                closeVehicleDetailsModal();
            }
        });
    }

    async function render() {
        try {
            // Show loading
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:60px; color:#9ca3af;">
                    <div style="display:inline-block; animation: spin 1s linear infinite;">⏳</div>
                    <div style="margin-top:12px;">Loading vehicles...</div>
                </div>
            `;

            // Fetch vehicles
            const response = await fetch(`${API_BASE_URL}/vehicles`);
            const result = await response.json();

            console.log('📦 Vehicles API response:', result);

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch vehicles');
            }

            const vehicles = result.data;
            console.log('🚛 Vehicles with parcel counts:', vehicles.map(v => ({
                reg: v.registration_number,
                parcels: v.assignedParcels
            })));

            if (vehicles.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:60px; color:#9ca3af;">
                        No vehicles found
                    </div>
                `;
                return;
            }

            grid.innerHTML = vehicles.map(v => {
                const statusClass = v.status === 'Dispatched' ? 'st-dispatched' : 
                                   v.status === 'Assigned' ? 'st-assigned' : 'st-pending';
                
                return `
                <div class="vehicle-card-modern">
                    <div class="vehicle-card-header">
                        <div class="vehicle-info-row">
                            <span class="material-symbols-outlined vehicle-icon">local_shipping</span>
                            <div>
                                <div class="vehicle-number">${v.registration_number}</div>
                                <div class="vehicle-capacity">${v.capacity}</div>
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">${v.status}</span>
                    </div>
                    
                    <div class="vehicle-card-body">
                        <div class="vehicle-detail-row">
                            <span class="material-symbols-outlined detail-icon">person</span>
                            <span>${v.driver?.name || 'No Driver'}</span>
                        </div>
                        <div class="vehicle-detail-row">
                            <span class="material-symbols-outlined detail-icon">call</span>
                            <span>${v.driver?.phone || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="vehicle-parcels-row">
                        <span class="material-symbols-outlined" style="font-size:18px;">inventory_2</span>
                        <span>Assigned Parcels</span>
                        <div class="parcel-count-badge">${v.assignedParcels || 0}</div>
                    </div>
                    
                    <div class="vehicle-card-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewVehicleDetails('${v.id}')">View Details</button>
                        <button class="btn btn-outline btn-sm" onclick="assignParcels('${v.id}')">Assign Parcels</button>
                    </div>
                </div>`;
            }).join("");

        } catch (error) {
            console.error('Error loading vehicles:', error);
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:60px; color:#ef4444;">
                    <div style="margin-bottom:8px;">❌ Error loading vehicles</div>
                    <div style="font-size:13px; color:#9ca3af;">${error.message}</div>
                    <button onclick="initVehiclesPage()" style="margin-top:16px; padding:8px 16px; background:#111827; color:white; border:none; border-radius:6px; cursor:pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Setup modal event listeners
    setupModalListeners();

    // Add vehicle button
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            openAddVehicleModal();
        });
    }

    // Initial render
    render();
}

// Setup modal event listeners
function setupModalListeners() {
    const closeBtn = document.getElementById('closeVehicleModal');
    const cancelBtn = document.getElementById('cancelVehicleModal');
    const nextBtn = document.getElementById('nextSelectParcels');
    
    if (closeBtn) {
        closeBtn.onclick = closeAddVehicleModal;
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = closeAddVehicleModal;
    }
    
    // nextBtn is handled by parcel selection modal
}

// Open add vehicle modal
function openAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    if (modal) {
        modal.classList.add('active');
        
        // Clear form
        document.getElementById('vehicleNumber').value = '';
        document.getElementById('driverName').value = '';
        document.getElementById('contactNumber').value = '';
    }
}

// Close modal
function closeAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Click outside modal to close
document.addEventListener('click', (e) => {
    const modal = document.getElementById('addVehicleModal');
    if (modal && e.target === modal) {
        closeAddVehicleModal();
    }
});

// View vehicle details
async function viewVehicleDetails(vehicleId) {
    console.log('View vehicle details:', vehicleId);
    
    try {
        // Fetch vehicle details
        const response = await fetch(`${API_BASE_URL}/vehicles`);
        const result = await response.json();
        
        if (!result.success) return;
        
        const vehicle = result.data.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        // Populate vehicle info
        document.getElementById('detailVehicleNumber').textContent = vehicle.registration_number;
        document.getElementById('detailVehicleStatus').textContent = vehicle.status;
        document.getElementById('detailVehicleStatus').className = `status-badge ${
            vehicle.status === 'Dispatched' ? 'st-dispatched' : 
            vehicle.status === 'Assigned' ? 'st-assigned' : 'st-pending'
        }`;
        document.getElementById('detailDriverName').textContent = vehicle.driver?.name || 'No Driver';
        document.getElementById('detailDriverPhone').textContent = vehicle.driver?.phone || 'N/A';
        document.getElementById('detailCapacity').textContent = vehicle.capacity;
        
        // Fetch assigned parcels
        const bookingsResponse = await fetch(`${API_BASE_URL}/bookings`);
        const bookingsResult = await bookingsResponse.json();
        
        if (bookingsResult.success) {
            const assignedParcels = bookingsResult.data.filter(b => 
                b.assigned_vehicle_id === vehicleId && b.status === 'IN-TRANSIT'
            );
            
            document.getElementById('detailParcelCount').textContent = assignedParcels.length;
            
            const tbody = document.getElementById('detailParcelsTableBody');
            if (assignedParcels.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#9ca3af;">No parcels assigned</td></tr>';
            } else {
                tbody.innerHTML = assignedParcels.map(parcel => `
                    <tr>
                        <td>${parcel.lr_number}</td>
                        <td>${parcel.company?.name || '-'}</td>
                        <td>${parcel.consignee_name}</td>
                        <td>${parcel.destination}</td>
                        <td>${parcel.article_count}</td>
                        <td>${new Date(parcel.updated_at).toLocaleDateString()}</td>
                        <td><span class="status-badge st-assigned">${parcel.status}</span></td>
                    </tr>
                `).join('');
            }
            
            // Generate activity timeline
            const activityList = document.getElementById('detailActivityList');
            const activities = [];
            
            if (vehicle.status === 'Dispatched') {
                activities.push({
                    text: `Vehicle status updated to <strong>Dispatched</strong>`,
                    time: '2 hours ago',
                    color: 'activity-green'
                });
            }
            
            if (assignedParcels.length > 0) {
                activities.push({
                    text: `${assignedParcels.length} parcel${assignedParcels.length > 1 ? 's' : ''} assigned`,
                    time: 'Today at 10:30 AM',
                    color: 'activity-blue'
                });
            }
            
            if (vehicle.driver) {
                activities.push({
                    text: `Driver ${vehicle.driver.name} checked in`,
                    time: 'Today at 8:00 AM',
                    color: 'activity-gray'
                });
            }
            
            if (activities.length === 0) {
                activityList.innerHTML = '<div style="text-align:center; padding:20px; color:#9ca3af;">No recent activity</div>';
            } else {
                activityList.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-dot ${activity.color}"></div>
                        <div>
                            <div class="activity-text">${activity.text}</div>
                            <div class="activity-time">${activity.time}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Show modal
        document.getElementById('vehicleDetailsModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading vehicle details:', error);
    }
}

function closeVehicleDetailsModal() {
    const modal = document.getElementById('vehicleDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Assign parcels to existing vehicle
async function assignParcels(vehicleId) {
    console.log('Assign parcels to vehicle:', vehicleId);
    
    try {
        // Fetch vehicle details
        const response = await fetch(`${API_BASE_URL}/vehicles`);
        const result = await response.json();
        
        if (!result.success) return;
        
        const vehicle = result.data.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        // Store vehicle data for assignment
        vehicleFormData = {
            vehicleId: vehicle.id,
            vehicleNo: vehicle.registration_number,
            driver: vehicle.driver?.name || 'Unknown',
            contact: vehicle.driver?.phone || 'N/A'
        };
        
        selectedParcels = [];
        
        // Update summary
        document.getElementById('summaryVehicleNo').textContent = vehicle.registration_number;
        document.getElementById('summaryDriver').textContent = vehicle.driver?.name || 'Unknown';
        document.getElementById('summaryContact').textContent = vehicle.driver?.phone || 'N/A';
        
        // Show parcel selection modal
        document.getElementById('selectParcelsModal').style.display = 'flex';
        
        // Load available parcels
        await loadAvailableParcels();
        
    } catch (error) {
        console.error('Error loading vehicle for assignment:', error);
    }
}


// ============================================
// PARCEL SELECTION MODAL FUNCTIONALITY
// ============================================

let vehicleFormData = {};
let selectedParcels = [];

// Initialize parcel selection modal
function initParcelSelectionModal() {
    // First modal (Add Vehicle) buttons
    const closeVehicleBtn = document.getElementById('closeVehicleModal');
    const cancelVehicleBtn = document.getElementById('cancelVehicleModal');
    const nextBtn = document.getElementById('nextSelectParcels');
    
    // Second modal (Select Parcels) buttons
    const backBtn = document.getElementById('backToVehicleDetails');
    const cancelBtn = document.getElementById('cancelSelectParcels');
    const createBtn = document.getElementById('createVehicleWithParcels');
    const closeBtn = document.getElementById('closeSelectParcelsModal');

    // Add Vehicle modal close/cancel
    if (closeVehicleBtn) {
        closeVehicleBtn.addEventListener('click', closeAddVehicleModal);
    }
    
    if (cancelVehicleBtn) {
        cancelVehicleBtn.addEventListener('click', closeAddVehicleModal);
    }

    // Next button
    if (nextBtn) {
        nextBtn.addEventListener('click', showParcelSelection);
    }

    // Select Parcels modal buttons
    if (backBtn) {
        backBtn.addEventListener('click', backToVehicleDetails);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAllModals);
    }

    if (createBtn) {
        createBtn.addEventListener('click', createVehicleWithParcels);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAllModals);
    }
}

function openAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    // Clear form
    const vehicleNumber = document.getElementById('vehicleNumber');
    const driverName = document.getElementById('driverName');
    const contactNumber = document.getElementById('contactNumber');
    
    if (vehicleNumber) vehicleNumber.value = '';
    if (driverName) driverName.value = '';
    if (contactNumber) contactNumber.value = '';
}

function closeAddVehicleModal() {
    const modal = document.getElementById('addVehicleModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Clear form
    const vehicleNumber = document.getElementById('vehicleNumber');
    const driverName = document.getElementById('driverName');
    const contactNumber = document.getElementById('contactNumber');
    
    if (vehicleNumber) vehicleNumber.value = '';
    if (driverName) driverName.value = '';
    if (contactNumber) contactNumber.value = '';
}

function closeAllModals() {
    closeParcelSelection();
    closeAddVehicleModal();
}

async function showParcelSelection() {
    // Validate vehicle details
    const vehicleNo = document.getElementById('vehicleNumber').value.trim();
    const driver = document.getElementById('driverName').value.trim();
    const contact = document.getElementById('contactNumber').value.trim();

    if (!vehicleNo || !driver || !contact) {
        // Show validation error without alert
        return;
    }

    // Store form data
    vehicleFormData = { vehicleNo, driver, contact };
    selectedParcels = [];

    // Update summary
    document.getElementById('summaryVehicleNo').textContent = vehicleNo;
    document.getElementById('summaryDriver').textContent = driver;
    document.getElementById('summaryContact').textContent = contact;

    // Hide vehicle modal, show parcel selection
    document.getElementById('addVehicleModal').style.display = 'none';
    document.getElementById('selectParcelsModal').style.display = 'flex';

    // Load available parcels
    await loadAvailableParcels();
}

async function loadAvailableParcels() {
    try {
        const tbody = document.getElementById('parcelsTableBody');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Loading parcels...</td></tr>';

        // Fetch all unassigned bookings (any status except Delivered)
        const response = await fetch(`${API_BASE_URL}/bookings`);
        const result = await response.json();

        if (!result.success) {
            throw new Error('Failed to load parcels');
        }

        // Filter for BOOKED parcels only (not yet assigned)
        const parcels = result.data.filter(b => 
            !b.assigned_vehicle_id && 
            b.status === 'BOOKED'
        );

        if (parcels.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#9ca3af;">No available parcels to assign</td></tr>';
            return;
        }

        tbody.innerHTML = parcels.map(parcel => `
            <tr data-parcel-id="${parcel.id}">
                <td>
                    <input type="checkbox" class="parcel-checkbox" value="${parcel.id}" 
                           onchange="toggleParcelSelection('${parcel.id}')">
                </td>
                <td>${parcel.lr_number}</td>
                <td>${parcel.company?.name || '-'}</td>
                <td>${parcel.consignee_name}</td>
                <td>${parcel.destination}</td>
                <td>${parcel.article_count}</td>
                <td>${parcel.weight ? parcel.weight + ' kg' : '-'}</td>
                <td>${parcel.parcel_type}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading parcels:', error);
        document.getElementById('parcelsTableBody').innerHTML = 
            '<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Failed to load parcels</td></tr>';
    }
}

function toggleParcelSelection(parcelId) {
    const checkbox = document.querySelector(`input[value="${parcelId}"]`);
    const row = document.querySelector(`tr[data-parcel-id="${parcelId}"]`);

    if (checkbox.checked) {
        selectedParcels.push(parcelId);
        row.classList.add('selected');
    } else {
        selectedParcels = selectedParcels.filter(id => id !== parcelId);
        row.classList.remove('selected');
    }

    updateSelectedCount();
}

function updateSelectedCount() {
    const selectedCountEl = document.getElementById('selectedCount');
    const assignCountEl = document.getElementById('assignCount');
    
    if (selectedCountEl) {
        selectedCountEl.textContent = `${selectedParcels.length} selected`;
    }
    if (assignCountEl) {
        assignCountEl.textContent = selectedParcels.length;
    }
}

function backToVehicleDetails() {
    document.getElementById('selectParcelsModal').style.display = 'none';
    document.getElementById('addVehicleModal').style.display = 'flex';
}

function closeParcelSelection() {
    const modal = document.getElementById('selectParcelsModal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedParcels = [];
    vehicleFormData = {};
}

async function createVehicleWithParcels() {
    try {
        const createBtn = document.getElementById('createVehicleWithParcels');
        createBtn.disabled = true;
        createBtn.textContent = 'Processing...';

        console.log('Vehicle data:', vehicleFormData);
        console.log('Assigning parcels:', selectedParcels);

        let vehicleId = vehicleFormData.vehicleId;
        let driverId = null;

        // If this is a new vehicle (no vehicleId), create it
        if (!vehicleId) {
            // Step 1: Create or find driver
            const driversResponse = await fetch(`${API_BASE_URL}/drivers`);
            const driversResult = await driversResponse.json();
            
            if (driversResult.success) {
                const existingDriver = driversResult.data?.find(d => 
                    d.phone === vehicleFormData.contact
                );
                
                if (existingDriver) {
                    driverId = existingDriver.id;
                } else {
                    // Create new driver
                    // Truncate phone to 20 chars to fit database constraint
                    const phoneNumber = vehicleFormData.contact.substring(0, 20);
                    
                    // Generate unique license number using timestamp
                    const uniqueLicense = `TBD-${Date.now()}`;
                    
                    const createDriverResponse = await fetch(`${API_BASE_URL}/drivers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: vehicleFormData.driver,
                            phone: phoneNumber,
                            license_number: uniqueLicense,
                            license_type: 'HMV',
                            status: 'Active',
                            current_status: 'Available'
                        })
                    });
                    
                    const createDriverResult = await createDriverResponse.json();
                    console.log('Driver creation result:', createDriverResult);
                    
                    if (createDriverResult.success) {
                        driverId = createDriverResult.data.id;
                        console.log('✅ Driver created with ID:', driverId);
                    } else {
                        console.error('❌ Failed to create driver:', createDriverResult);
                    }
                }
            }
            
            if (!driverId) {
                console.error('❌ No driver ID available');
            }

            // Step 2: Create vehicle
            console.log('Creating vehicle with driver ID:', driverId);
            
            const createVehicleResponse = await fetch(`${API_BASE_URL}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registration_number: vehicleFormData.vehicleNo,
                    vehicle_type: 'Truck',
                    capacity: '5 Tons',
                    capacity_kg: 5000,
                    make: 'TBD',
                    model: 'TBD',
                    year: new Date().getFullYear(),
                    status: selectedParcels.length > 0 ? 'Assigned' : 'Available',
                    current_driver_id: driverId
                })
            });

            const createVehicleResult = await createVehicleResponse.json();
            
            console.log('Vehicle creation result:', createVehicleResult);
            
            if (!createVehicleResult.success) {
                throw new Error(createVehicleResult.error || 'Failed to create vehicle');
            }

            vehicleId = createVehicleResult.data.id;
            
            // Update driver with assigned vehicle
            if (driverId) {
                await fetch(`${API_BASE_URL}/drivers/${driverId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assigned_vehicle_id: vehicleId
                    })
                });
            }
        } else {
            // For existing vehicle, get the driver ID
            const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles`);
            const vehicleResult = await vehicleResponse.json();
            const vehicle = vehicleResult.data?.find(v => v.id === vehicleId);
            driverId = vehicle?.current_driver_id;
        }

        // Step 3: Assign selected parcels to vehicle
        if (selectedParcels.length > 0) {
            console.log('Assigning', selectedParcels.length, 'parcels to vehicle', vehicleId);
            
            for (const parcelId of selectedParcels) {
                const updateResponse = await fetch(`${API_BASE_URL}/bookings/${parcelId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assigned_vehicle_id: vehicleId,
                        assigned_driver_id: driverId,
                        status: 'IN-TRANSIT'
                    })
                });
                
                const updateResult = await updateResponse.json();
                
                if (updateResult.success) {
                    console.log('✅ Parcel', parcelId, 'assigned successfully');
                } else {
                    console.error('❌ Failed to assign parcel', parcelId, ':', updateResult);
                }
            }
            
            console.log('✅', selectedParcels.length, 'parcels assigned successfully');
        } else {
            console.log('⚠️ No parcels selected for assignment');
        }

        // Close modals and refresh
        closeParcelSelection();
        const addModal = document.getElementById('addVehicleModal');
        if (addModal) {
            addModal.style.display = 'none';
        }
        
        // Reload vehicles page
        if (typeof initVehiclesPage === 'function') {
            await initVehiclesPage();
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        const createBtn = document.getElementById('createVehicleWithParcels');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = `Create Vehicle & Assign (${selectedParcels.length})`;
        }
    }
}

// Make function globally accessible
window.toggleParcelSelection = toggleParcelSelection;
