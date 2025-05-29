// TrashDrop Collector App - Top Navigation Dropdown Functionality

document.addEventListener('DOMContentLoaded', () => {
    // Get the dropdown button and content
    const dropdownBtn = document.querySelector('.account-dropdown-btn');
    const dropdownContent = document.querySelector('.account-dropdown-content');
    
    if (dropdownBtn && dropdownContent) {
        // Toggle dropdown when clicking the button
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
        
        // Close dropdown when clicking anywhere else
        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
        
        // Handle escape key to close dropdown
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
            }
        });
    }
    
    // Populate user name if available
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName) {
        // Try to get user data from localStorage or session
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.firstName && userData.lastName) {
            userDisplayName.textContent = `${userData.firstName} ${userData.lastName}`;
        } else if (userData.email) {
            userDisplayName.textContent = userData.email;
        }
    }
});
