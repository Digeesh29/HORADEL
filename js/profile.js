// Profile Page JavaScript

function initProfilePage() {
    console.log('👤 Initializing Profile page...');
    loadProfileData();
}

async function loadProfileData() {
    try {
        // In a real app, this would fetch from an API
        // For now, we'll use mock data that matches the design
        const profileData = {
            fullName: 'Admin User',
            email: 'admin@horadel.com',
            phone: '+91 9876543210',
            location: 'Mumbai, Maharashtra',
            role: 'System Administrator',
            memberSince: 'January 15, 2023',
            totalBookings: '1,247',
            vehiclesManaged: '48',
            companyName: 'ABC Transport Services',
            companyPhone: '+91 22 1234 5678',
            companyEmail: 'info@abctransport.com',
            gstNumber: '27AABCU9603R1ZM',
            transportLicense: 'MH-TR-2023-001234',
            companyAddress: 'Shop No. 15, Transport Nagar, Andheri East, Mumbai - 400069'
        };

        // Update all fields
        document.getElementById('fullName').value = profileData.fullName;
        document.getElementById('email').value = profileData.email;
        document.getElementById('phone').value = profileData.phone;
        document.getElementById('location').value = profileData.location;
        document.getElementById('role').value = profileData.role;
        document.getElementById('memberSince').value = profileData.memberSince;
        document.getElementById('totalBookings').textContent = profileData.totalBookings;
        document.getElementById('vehiclesManaged').textContent = profileData.vehiclesManaged;
        document.getElementById('companyName').value = profileData.companyName;
        document.getElementById('companyPhone').value = profileData.companyPhone;
        document.getElementById('companyEmail').value = profileData.companyEmail;
        document.getElementById('gstNumber').value = profileData.gstNumber;
        document.getElementById('transportLicense').value = profileData.transportLicense;
        document.getElementById('companyAddress').value = profileData.companyAddress;
        document.getElementById('profileRole').textContent = profileData.role;
        document.getElementById('profileCompany').textContent = profileData.companyName;

        // Fetch real stats from API
        await loadActivityStats();
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

async function loadActivityStats() {
    try {
        // Fetch total bookings
        const bookingsResponse = await fetch(`${API_BASE_URL}/bookings`);
        if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            const totalBookingsEl = document.getElementById('totalBookings');
            if (totalBookingsEl) {
                totalBookingsEl.textContent = bookingsData.count.toLocaleString();
            }
        }

        // Fetch total vehicles
        const vehiclesResponse = await fetch(`${API_BASE_URL}/vehicles`);
        if (vehiclesResponse.ok) {
            const vehiclesData = await vehiclesResponse.json();
            const vehiclesManagedEl = document.getElementById('vehiclesManaged');
            if (vehiclesManagedEl) {
                vehiclesManagedEl.textContent = vehiclesData.data.length;
            }
        }
    } catch (error) {
        console.error('Error loading activity stats:', error);
    }
}

function editProfile() {
    // Toggle readonly state
    const inputs = document.querySelectorAll('.profile-card input');
    const isReadonly = inputs[0].hasAttribute('readonly');
    
    if (isReadonly) {
        inputs.forEach(input => {
            if (!input.id.includes('total') && !input.id.includes('vehicles')) {
                input.removeAttribute('readonly');
                input.style.backgroundColor = '#fff';
            }
        });
        event.target.textContent = '💾 Save Profile';
        event.target.classList.remove('btn-secondary');
        event.target.classList.add('btn-primary');
    } else {
        // Save changes
        saveProfile();
        inputs.forEach(input => {
            input.setAttribute('readonly', true);
            input.style.backgroundColor = '#f8f9fa';
        });
        event.target.textContent = '✏️ Edit Profile';
        event.target.classList.remove('btn-primary');
        event.target.classList.add('btn-secondary');
    }
}

async function saveProfile() {
    try {
        const profileData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            companyName: document.getElementById('companyName').value,
            companyPhone: document.getElementById('companyPhone').value,
            companyEmail: document.getElementById('companyEmail').value,
            gstNumber: document.getElementById('gstNumber').value,
            transportLicense: document.getElementById('transportLicense').value,
            companyAddress: document.getElementById('companyAddress').value
        };

        // In a real app, this would POST to an API
        console.log('Saving profile:', profileData);
        
        // Show success message
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile. Please try again.');
    }
}

function changePassword() {
    // In a real app, this would open a modal or navigate to password change page
    const newPassword = prompt('Enter new password:');
    if (newPassword) {
        console.log('Password change requested');
        alert('Password changed successfully!');
    }
}

function enable2FA() {
    // In a real app, this would open a 2FA setup modal
    alert('Two-Factor Authentication setup will be available soon.');
}

function viewSessions() {
    // In a real app, this would show active sessions
    alert('Active Sessions:\n\n1. Current Session (Windows, Chrome)\n   Mumbai, India\n   Active now\n\n2. Mobile Session (Android, Chrome)\n   Mumbai, India\n   2 hours ago');
}
