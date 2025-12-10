// Dashboard interactions (all read-only in your example)
const btnDashboard = document.querySelector('.nav-btn[href="dashboard.html"]') || document.getElementById('btnDashboard');
const btnBooking = document.querySelector('.nav-btn[href="booking.html"]');
const btnParcelMgmt = document.querySelector('.nav-btn[href="parcelmgmt.html"]');

// Scroll-to-top buttons (New Booking on dashboard)
const newBookingTop = document.getElementById('newBookingTop');

newBookingTop && newBookingTop.addEventListener('click', () => {
  // Redirect to booking page
  window.location.href = 'booking.html';
});

// For hover actions/icons on recent bookings table
document.querySelectorAll('.actions i').forEach(icon => {
  icon.addEventListener('click', () => {
    alert('This is a demo action for ' + icon.title);
  });
});

// Optionally highlight the dashboard nav
if(btnDashboard) btnDashboard.classList.add('active');
