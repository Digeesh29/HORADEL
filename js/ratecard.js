// js/ratecard.js

let rateCards = [];
let tbody, exportBtn, openModalBtn, rateModal, closeModalBtn, cancelModalBtn, saveRateBtn, modalTitle;
let rCompany, rBase, rPerArticle, rTypePrice, rZonePrice;
let editingCompany = null;

function initRateCardPage() {
    console.log('💳 Initializing Rate Card page...');
    
    // Get DOM elements
    tbody = document.getElementById("rateCardTableBody");
    openModalBtn = document.getElementById("openRateModal");
    rateModal = document.getElementById("rateModal");
    closeModalBtn = document.getElementById("closeRateModal");
    cancelModalBtn = document.getElementById("cancelRateModal");
    saveRateBtn = document.getElementById("saveRateCard");
    modalTitle = document.getElementById("rateModalTitle");
    
    rCompany = document.getElementById("rCompany");
    rPerArticle = document.getElementById("rPerArticle");
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    loadRateCards();
}

function formatRs(v) {
    return "₹" + v.toString();
}

function renderRateCards() {
    if (!tbody) {
        console.error('tbody element not found');
        return;
    }

    console.log('Rendering', rateCards.length, 'rate cards');

    tbody.innerHTML = rateCards.map(card => `
        <div class="rate-card-row">
            <div class="rate-card-col">${card.company}</div>
            <div class="rate-card-col">${formatRs(card.perArticle)}</div>
            <div class="rate-card-col">
                <button class="btn js-edit-rate" data-company="${card.company}">
                    <span class="material-symbols-outlined">edit</span>
                    Edit Rate Card
                </button>
            </div>
        </div>
    `).join("");
}

async function loadRateCards() {
    try {
        console.log('📋 Fetching rate cards from API...');
        const response = await fetch(`${API_BASE_URL}/ratecards`);
        const result = await response.json();
        
        console.log('API Response:', result);
        
        if (result.success && result.data.length > 0) {
            // Transform API data to match our format
            rateCards = result.data.map(card => {
                // Parse parcel_type_charges JSON
                const parcelCharges = typeof card.parcel_type_charges === 'string' 
                    ? JSON.parse(card.parcel_type_charges) 
                    : card.parcel_type_charges;
                
                return {
                    id: card.id,
                    company: card.company?.name || 'Unknown',
                    company_id: card.company_id,
                    base: card.base_rate,
                    perArticle: card.per_article_rate,
                    parcelType: parcelCharges?.Standard || 0,
                    zoneRate: parcelCharges?.Express || 0,
                    updated: card.effective_from
                };
            });
            
            console.log('✅ Loaded', rateCards.length, 'rate cards');
        } else {
            console.log('⚠️ No rate cards found, using sample data');
            // Fallback to sample data
            rateCards = [
                { company: "TechCorp",      base: 500, perArticle: 15, parcelType: 25, zoneRate: 100, updated: "2024-12-01" },
                { company: "GlobalTrade",   base: 450, perArticle: 12, parcelType: 20, zoneRate:  90, updated: "2024-11-28" },
                { company: "FastShip",      base: 600, perArticle: 18, parcelType: 30, zoneRate: 120, updated: "2024-12-02" },
                { company: "QuickMove",     base: 550, perArticle: 16, parcelType: 28, zoneRate: 110, updated: "2024-11-30" },
                { company: "EasyLogistics", base: 480, perArticle: 14, parcelType: 22, zoneRate:  95, updated: "2024-12-03" }
            ];
        }
        
        renderRateCards();
    } catch (error) {
        console.error('❌ Error loading rate cards:', error);
        // Fallback to sample data
        rateCards = [
            { company: "TechCorp",      base: 500, perArticle: 15, parcelType: 25, zoneRate: 100, updated: "2024-12-01" },
            { company: "GlobalTrade",   base: 450, perArticle: 12, parcelType: 20, zoneRate:  90, updated: "2024-11-28" },
            { company: "FastShip",      base: 600, perArticle: 18, parcelType: 30, zoneRate: 120, updated: "2024-12-02" },
            { company: "QuickMove",     base: 550, perArticle: 16, parcelType: 28, zoneRate: 110, updated: "2024-11-30" },
            { company: "EasyLogistics", base: 480, perArticle: 14, parcelType: 22, zoneRate:  95, updated: "2024-12-03" }
        ];
        renderRateCards();
    }
}

function openModal(editCompanyName) {
    editingCompany = editCompanyName || null;

    if (editingCompany) {
        const card = rateCards.find(r => r.company === editingCompany);
        if (card) {
            modalTitle.textContent = `Edit Rate Card - ${card.company}`;
            rCompany.value = card.company;
            rCompany.readOnly = true;
            rCompany.style.backgroundColor = '#f3f4f6';
            rPerArticle.value = card.perArticle;
        }
    } else {
        modalTitle.textContent = "Add New Rate Card";
        rCompany.value = "";
        rCompany.readOnly = false;
        rCompany.style.backgroundColor = '';
        rPerArticle.value = "";
    }

    rateModal.style.display = "flex";
}

function closeModal() {
    rateModal.style.display = "none";
    editingCompany = null;
}

async function saveRateCard() {
    const company = rCompany.value.trim();
    const perArt = parseInt(rPerArticle.value, 10) || 0;

    if (!company || !perArt) {
        alert("Please enter both Company Name and Per Article Rate.");
        return;
    }

    try {
        // Disable save button to prevent double-clicks
        saveRateBtn.disabled = true;
        saveRateBtn.textContent = 'Saving...';

        const today = new Date().toISOString().split('T')[0];

        // Check if we're editing an existing rate card
        const existingCard = rateCards.find(r => r.company === company);

        if (existingCard && existingCard.id) {
            // Update existing rate card
            console.log('Updating rate card:', existingCard.id);
            
            const response = await fetch(`${API_BASE_URL}/ratecards/${existingCard.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    base_rate: 0,
                    per_article_rate: perArt,
                    parcel_type_charges: { Standard: 0, Express: 0 },
                    effective_from: today
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to update rate card');
            }

            console.log('✅ Rate card updated successfully');
        } else {
            // Create new rate card - need to find or create company first
            console.log('Creating new rate card for:', company);
            
            // First, try to find the company
            const companiesResponse = await fetch(`${API_BASE_URL}/companies`);
            const companiesResult = await companiesResponse.json();
            
            let companyId = null;
            
            if (companiesResult.success) {
                const existingCompany = companiesResult.data.find(c => 
                    c.name.toLowerCase() === company.toLowerCase()
                );
                
                if (existingCompany) {
                    companyId = existingCompany.id;
                    console.log('Found existing company:', companyId);
                } else {
                    // Company doesn't exist, create it
                    console.log('Creating new company:', company);
                    
                    const createCompanyResponse = await fetch(`${API_BASE_URL}/companies`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: company,
                            contact_person: 'Admin',
                            phone: '+91-0000000000',
                            email: `${company.toLowerCase().replace(/\s+/g, '')}@example.com`,
                            company_type: 'Corporate',
                            status: 'Active'
                        })
                    });
                    
                    const createCompanyResult = await createCompanyResponse.json();
                    
                    if (!createCompanyResult.success) {
                        throw new Error('Failed to create company');
                    }
                    
                    companyId = createCompanyResult.data.id;
                    console.log('Created new company:', companyId);
                }
            }
            
            if (!companyId) {
                throw new Error('Could not find or create company');
            }
            
            // Now create the rate card
            const createRateCardResponse = await fetch(`${API_BASE_URL}/ratecards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    company_id: companyId,
                    base_rate: 0,
                    per_article_rate: perArt,
                    parcel_type_charges: { Standard: 0, Express: 0 },
                    effective_from: today
                })
            });
            
            const createRateCardResult = await createRateCardResponse.json();
            
            if (!createRateCardResult.success) {
                throw new Error(createRateCardResult.error || 'Failed to create rate card');
            }
            
            console.log('✅ Rate card created successfully');
        }

        // Reload data from API
        await loadRateCards();
        closeModal();
        
        // Show success message
        alert('Rate card saved successfully!');
        
    } catch (error) {
        console.error('❌ Error saving rate card:', error);
        alert('Failed to save rate card: ' + error.message);
    } finally {
        saveRateBtn.disabled = false;
        saveRateBtn.textContent = 'Save Changes';
    }
}

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

function setupEventListeners() {
    // Open modal (Add)
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => openModal(null));
    }

    // Close modal buttons
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
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

}
