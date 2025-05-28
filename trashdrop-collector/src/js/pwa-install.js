/**
 * TrashDrop Collector - PWA Installation
 * Handles the PWA installation prompt
 */

// Store the deferred prompt for later use
let deferredPrompt;
let installButton = null;

/**
 * Initialize the PWA install functionality
 */
function initPWAInstall() {
    // Find install button if it exists
    installButton = document.getElementById('pwaInstallButton');
    
    // Add event listener for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        
        // Store the event for later use
        deferredPrompt = e;
        
        // Show the install button if it exists
        if (installButton) {
            installButton.style.display = 'block';
            installButton.addEventListener('click', handleInstallClick);
        } else {
            // If no install button exists, create one
            createInstallButton();
        }
        
        console.log('PWA is installable!');
    });
    
    // Add event listener for appinstalled event
    window.addEventListener('appinstalled', () => {
        // Hide install button after installation
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        // Reset the deferred prompt
        deferredPrompt = null;
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('TrashDrop Collector has been installed successfully!', 'success');
        }
        
        console.log('PWA was installed');
    });
}

/**
 * Create an install button if one doesn't exist
 */
function createInstallButton() {
    // Only create if one doesn't already exist
    if (!document.getElementById('pwaInstallButton')) {
        // Create the button
        const button = document.createElement('button');
        button.id = 'pwaInstallButton';
        button.className = 'pwa-install-button';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.29 7 12 12 20.71 7"></polyline>
                <line x1="12" y1="22" x2="12" y2="12"></line>
            </svg>
            Install App
        `;
        
        // Style the button
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '999';
        button.style.padding = '10px 16px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.gap = '8px';
        button.style.cursor = 'pointer';
        
        // Add hover effect
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#45a049';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#4CAF50';
        });
        
        // Add click handler
        button.addEventListener('click', handleInstallClick);
        
        // Add to body
        document.body.appendChild(button);
        
        // Update the reference
        installButton = button;
    }
}

/**
 * Handle click on the install button
 */
async function handleInstallClick() {
    if (!deferredPrompt) {
        console.log('The app is already installed or not installable');
        return;
    }
    
    // Show the installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    // Reset the deferred prompt
    deferredPrompt = null;
    
    console.log(`User ${outcome} the installation`);
}

// Initialize PWA install functionality when DOM is ready
document.addEventListener('DOMContentLoaded', initPWAInstall);

// Export functions to global scope
window.initPWAInstall = initPWAInstall;
