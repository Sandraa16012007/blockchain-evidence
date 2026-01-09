// Dashboard Fix Script
// This script provides fallback functionality for dashboard loading

function fixDashboardLoading() {
    // Check if we're on the dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        // Add a timeout to catch loading issues
        setTimeout(() => {
            const loadingState = document.getElementById('loadingState');
            const errorState = document.getElementById('errorState');
            
            // If still loading after 10 seconds, show error
            if (loadingState && !loadingState.classList.contains('hidden')) {
                console.log('Dashboard loading timeout - showing fallback');
                showDashboardFallback();
            }
        }, 10000);
    }
}

function showDashboardFallback() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    if (errorMessage) {
        errorMessage.innerHTML = `
            <p>Dashboard is taking longer than expected to load.</p>
            <p><strong>Possible solutions:</strong></p>
            <ul style="text-align: left; margin: 16px 0;">
                <li>Check your internet connection</li>
                <li>Refresh the page</li>
                <li>Clear browser cache</li>
                <li>Try logging in again</li>
            </ul>
        `;
    }
}

// Initialize the fix when DOM is loaded
document.addEventListener('DOMContentLoaded', fixDashboardLoading);