// Bookings Page - uses API_BASE_URL from dashboard.js
async function initBookingsPage() {
    console.log('📋 Initializing Bookings Page...');
    
    const companySelect = document.getElementById("bookingsCompany");
    const statusSelect  = document.getElementById("bookingsStatus");
    const searchInput   = document.getElementById("bookingSearch");
    const filterBtn     = document.getElementById("bookingsFilterBtn");
    const tbody         = document.getElementById("bookingsTableBody");

    if (!tbody) {
        console.error('❌ Bookings table body not found!');
        return;
    }

    console.log('✅ All elements found');

    // Load companies and cities for dropdowns
    await loadCompanies();
    await loadCities();

    function getStatusClass(status) {
        switch (status) {
            case "BOOKED":      return "st-pending";
            case "IN-TRANSIT":  return "st-assigned";
            case "DELIVERED":   return "st-dispatched";
            default:            return "st-pending";
        }
    }

    async function loadCompanies() {
        try {
            const response = await fetch(`${API_BASE_URL}/companies`);
            const result = await response.json();
            
            if (result.success && result.data) {
                // Clear existing options except "All Companies"
                companySelect.innerHTML = '<option value="All">All Companies</option>';
                
                result.data.forEach(company => {
                    const opt = document.createElement("option");
                    opt.value = company.id;
                    opt.textContent = company.name;
                    companySelect.appendChild(opt);
                });
                
                console.log(`✅ Loaded ${result.data.length} companies`);
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        }
    }

    async function loadCities() {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`);
            const result = await response.json();
            
            if (result.success && result.data) {
                // Extract unique destinations
                const cities = [...new Set(result.data.map(b => b.destination))].filter(Boolean).sort();
                
                const citySelect = document.getElementById('bookingsCity');
                if (citySelect) {
                    // Clear existing options except "All Cities"
                    citySelect.innerHTML = '<option value="All">All Cities</option>';
                    
                    cities.forEach(city => {
                        const opt = document.createElement("option");
                        opt.value = city;
                        opt.textContent = city;
                        citySelect.appendChild(opt);
                    });
                    
                    console.log(`✅ Loaded ${cities.length} cities`);
                }
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    }

    async function loadCities() {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const cities = [...new Set(result.data.map(b => b.destination))].sort();
                const citySelect = document.getElementById('bookingsCity');
                if (citySelect) {
                    cities.forEach(city => {
                        const opt = document.createElement("option");
                        opt.value = city;
                        opt.textContent = city;
                        citySelect.appendChild(opt);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    }

    async function render() {
        try {
            // Show loading
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding:40px; color:#9ca3af;">
                        <div style="display:inline-block; animation: spin 1s linear infinite;">⏳</div>
                        Loading bookings...
                    </td>
                </tr>
            `;

            // Build query params
            const params = new URLSearchParams();
            const companyId = companySelect.value;
            const status = statusSelect.value;
            const search = searchInput.value.trim();
            const dateFrom = document.getElementById('dateFrom')?.value;
            const dateTo = document.getElementById('dateTo')?.value;
            const city = document.getElementById('bookingsCity')?.value;

            // Get company name from selected option
            const companyName = companyId !== 'All' ? companySelect.options[companySelect.selectedIndex].text : 'All';

            if (companyName && companyName !== 'All') params.append('company', companyName);
            if (status && status !== 'All') params.append('status', status);
            if (search) params.append('lrNumber', search);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);

            console.log('Filters:', { company: companyName, status, search, dateFrom, dateTo, city });

            // Fetch bookings
            const response = await fetch(`${API_BASE_URL}/bookings?${params}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch bookings');
            }

            let bookings = result.data;

            // Client-side city filter
            if (city && city !== 'All') {
                bookings = bookings.filter(b => b.destination === city);
            }

            // Update count
            const countEl = document.getElementById("bookingsCount");
            if (countEl) countEl.textContent = bookings.length;

            if (bookings.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align:center; padding:40px; color:#9ca3af;">
                            No bookings found
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = bookings.map(b => {
                const badgeClass = getStatusClass(b.status);
                const companyName = b.company?.name || 'N/A';
                const vehicleDisplay = b.vehicle?.registration_number
                    ? b.vehicle.registration_number
                    : '<span style="color:#9ca3af">Unassigned</span>';
                
                const bookingDate = new Date(b.booking_date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                return `
                    <tr>
                        <td style="font-weight:500;">${b.lr_number}</td>
                        <td>${bookingDate}</td>
                        <td>${companyName}</td>
                        <td>${b.consignee_name}</td>
                        <td>${b.destination}</td>
                        <td>${b.article_count}</td>
                        <td>${b.parcel_type}</td>
                        <td>${vehicleDisplay}</td>
                        <td>
                            <span class="status-badge ${badgeClass}">${b.status}</span>
                        </td>
                        <td>
                            <button class="view-btn-icon" onclick="viewBookingDetails('${b.id}')">
                                <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
                            </button>
                            <button class="view-btn-icon" onclick='printBookingPDF(${JSON.stringify(b).replace(/"/g, "&quot;")})'>
                                <span class="material-symbols-outlined" style="font-size:18px;">print</span>
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");

        } catch (error) {
            console.error('Error loading bookings:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding:40px; color:#ef4444;">
                        <div style="margin-bottom:8px;">❌ Error loading bookings</div>
                        <div style="font-size:13px; color:#9ca3af;">${error.message}</div>
                        <button onclick="initBookingsPage()" style="margin-top:16px; padding:8px 16px; background:#111827; color:white; border:none; border-radius:6px; cursor:pointer;">
                            Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    // Events
    filterBtn.addEventListener("click", render);
    
    const citySelect = document.getElementById("bookingsCity");
    if (citySelect) citySelect.addEventListener("change", render);
    
    searchInput.addEventListener("keyup", e => { if (e.key === "Enter") render(); });
    
    // Reset button
    const resetBtn = document.getElementById("bookingsResetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            document.getElementById("dateFrom").value = "";
            document.getElementById("dateTo").value = "";
            companySelect.value = "All";
            statusSelect.value = "All";
            searchInput.value = "";
            const citySelect = document.getElementById("bookingsCity");
            if (citySelect) citySelect.value = "All";
            render();
        });
    }

    // Initial render
    render();
}

// View booking details
async function viewBookingDetails(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`);
        const result = await response.json();
        
        if (result.success) {
            const b = result.data;
            const details = `
LR Number: ${b.lr_number}
Date: ${new Date(b.booking_date).toLocaleString('en-IN')}

Company: ${b.company?.name || 'N/A'}
Contact: ${b.company?.phone || 'N/A'}

Consignee: ${b.consignee_name}
Contact: ${b.consignee_contact}
Address: ${b.consignee_address}

Origin: ${b.origin}
Destination: ${b.destination}
Pincode: ${b.destination_pincode}

Articles: ${b.article_count}
Type: ${b.parcel_type}
Weight: ${b.weight || 'N/A'} kg
Description: ${b.description || 'N/A'}

Vehicle: ${b.vehicle?.registration_number || 'Not Assigned'}
Driver: ${b.driver?.name || 'Not Assigned'}

Status: ${b.status}
Total Amount: ₹${b.grand_total}
Payment Status: ${b.payment_status}
            `;
            alert(details);
        }
    } catch (error) {
        console.error('Error fetching booking details:', error);
        alert('Failed to load booking details');
    }
}
