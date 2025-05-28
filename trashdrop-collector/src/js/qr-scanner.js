/**
 * TrashDrop Collector - QR Code Scanner
 * Handles QR code scanning functionality
 */

// Scanner instance and state
let scanner = null;
let scannerActive = false;
let scannerContainer = null;
let scannerOverlay = null;

/**
 * Initialize QR scanner functionality
 * @param {String} containerId - ID of element to contain the scanner
 * @param {Function} onScanCallback - Callback function when QR code is detected
 */
function initQRScanner(containerId, onScanCallback) {
    // Make sure we have the container
    scannerContainer = document.getElementById(containerId);
    
    if (!scannerContainer) {
        console.error(`QR Scanner container with ID '${containerId}' not found`);
        return false;
    }
    
    // Load the QR scanner library dynamically
    loadQRScannerLibrary()
        .then(() => {
            console.log('QR Scanner library loaded successfully');
            
            // Create scanner instance if not already created
            if (!scanner) {
                try {
                    // Create HTML5 QR scanner instance
                    scanner = new Html5QrcodeScanner(
                        containerId,
                        { 
                            fps: 10, 
                            qrbox: 250,
                            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                        }
                    );
                    
                    // Add success callback
                    const successCallback = (decodedText, decodedResult) => {
                        // Stop scanner after success
                        stopQRScanner();
                        
                        // Play success sound
                        playBeepSound();
                        
                        // Call the provided callback with the result
                        if (typeof onScanCallback === 'function') {
                            onScanCallback(decodedText, decodedResult);
                        }
                    };
                    
                    // Add error callback
                    const errorCallback = (error) => {
                        // Only log scanning failures in console, don't alert the user
                        console.log(`QR scanning error: ${error}`);
                    };
                    
                    // Render the scanner
                    scanner.render(successCallback, errorCallback);
                    
                    // Add scanning overlay with animation
                    addScannerOverlay(containerId);
                    
                    scannerActive = true;
                    console.log('QR Scanner initialized');
                    
                    return true;
                } catch (error) {
                    console.error('QR Scanner initialization failed:', error);
                    return false;
                }
            }
        })
        .catch(error => {
            console.error('Failed to load QR Scanner library:', error);
            
            // Show notification if available
            if (window.showNotification) {
                window.showNotification('Failed to load QR scanner. Please check your connection and try again.', 'error');
            }
            
            return false;
        });
}

/**
 * Load the QR scanner library dynamically
 * @returns {Promise} - Resolves when library is loaded
 */
function loadQRScannerLibrary() {
    return new Promise((resolve, reject) => {
        // Check if library is already loaded
        if (window.Html5QrcodeScanner) {
            resolve();
            return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://unpkg.com/html5-qrcode@2.2.1/html5-qrcode.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load QR scanner library'));
        
        // Add to document
        document.head.appendChild(script);
    });
}

/**
 * Start the QR scanner
 * @param {String} containerId - ID of element to contain the scanner
 * @param {Function} onScanCallback - Callback function when QR code is detected
 */
function startQRScanner(containerId, onScanCallback) {
    // Initialize scanner if not already
    if (!scanner) {
        return initQRScanner(containerId, onScanCallback);
    }
    
    // If scanner exists but is not active, make it visible
    if (!scannerActive) {
        scannerContainer.style.display = 'block';
        
        // Show overlay if it exists
        if (scannerOverlay) {
            scannerOverlay.style.display = 'block';
        } else {
            addScannerOverlay(containerId);
        }
        
        scannerActive = true;
    }
    
    return true;
}

/**
 * Stop the QR scanner
 */
function stopQRScanner() {
    if (scanner && scannerActive) {
        // Hide the scanner container
        if (scannerContainer) {
            scannerContainer.style.display = 'none';
        }
        
        // Hide overlay if it exists
        if (scannerOverlay) {
            scannerOverlay.style.display = 'none';
        }
        
        scannerActive = false;
    }
}

/**
 * Play a beep sound when QR code is detected
 */
function playBeepSound() {
    const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+
                           'dvT18AAAAAAAA//////////////////' +
                           'v///v///v///v///v///v///v///P///v/AAP');
    beep.play().catch(err => console.log('Audio play failed:', err));
}

/**
 * Add scanner overlay with scanning animation
 * @param {String} containerId - ID of element containing the scanner
 */
function addScannerOverlay(containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    // Create overlay element
    scannerOverlay = document.createElement('div');
    scannerOverlay.className = 'qr-scanner-overlay';
    scannerOverlay.style.position = 'absolute';
    scannerOverlay.style.top = '0';
    scannerOverlay.style.left = '0';
    scannerOverlay.style.width = '100%';
    scannerOverlay.style.height = '100%';
    scannerOverlay.style.pointerEvents = 'none';
    
    // Create scanning line
    const scanLine = document.createElement('div');
    scanLine.className = 'qr-scan-line';
    scanLine.style.position = 'absolute';
    scanLine.style.left = '10%';
    scanLine.style.width = '80%';
    scanLine.style.height = '2px';
    scanLine.style.background = 'rgba(76, 175, 80, 0.8)';
    scanLine.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.8)';
    scanLine.style.animation = 'qrScanAnimation 2.5s infinite';
    
    // Add the animation style
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes qrScanAnimation {
            0% { top: 20%; }
            50% { top: 80%; }
            100% { top: 20%; }
        }
    `;
    
    // Add elements to DOM
    document.head.appendChild(styleElement);
    scannerOverlay.appendChild(scanLine);
    container.appendChild(scannerOverlay);
    
    // Position the overlay correctly within container
    container.style.position = 'relative';
}

/**
 * Check if the device has a camera
 * @returns {Promise<Boolean>} - Promise resolving to true if camera available
 */
function checkCameraAvailability() {
    return new Promise((resolve) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log('mediaDevices not supported');
            resolve(false);
            return;
        }
        
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const hasCamera = devices.some(device => device.kind === 'videoinput');
                resolve(hasCamera);
            })
            .catch(() => {
                resolve(false);
            });
    });
}

/**
 * Create QR scanner modal
 * @param {Function} onScanCallback - Callback for when QR code is scanned
 */
async function openQRScannerModal(onScanCallback) {
    // Check if camera is available
    const cameraAvailable = await checkCameraAvailability();
    
    if (!cameraAvailable) {
        if (window.showNotification) {
            window.showNotification('No camera found. Please ensure camera access is granted.', 'error');
        }
        return;
    }
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'qrScannerModal';
    modal.className = 'qr-scanner-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    // Create scanner container
    const scannerDiv = document.createElement('div');
    scannerDiv.id = 'qrScannerContainer';
    scannerDiv.style.width = '80%';
    scannerDiv.style.maxWidth = '500px';
    scannerDiv.style.height = '60%';
    scannerDiv.style.backgroundColor = 'white';
    scannerDiv.style.borderRadius = '8px';
    scannerDiv.style.overflow = 'hidden';
    
    // Create header
    const header = document.createElement('div');
    header.style.padding = '16px';
    header.style.backgroundColor = '#4CAF50';
    header.style.color = 'white';
    header.style.textAlign = 'center';
    
    const title = document.createElement('h3');
    title.textContent = 'Scan QR Code';
    title.style.margin = '0';
    header.appendChild(title);
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.padding = '10px 20px';
    closeBtn.style.margin = '16px';
    closeBtn.style.backgroundColor = '#E0E0E0';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    
    // Add event listener to close button
    closeBtn.addEventListener('click', () => {
        stopQRScanner();
        document.body.removeChild(modal);
    });
    
    // Assemble the modal
    modal.appendChild(scannerDiv);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
    
    // Initialize scanner
    initQRScanner('qrScannerContainer', (decodedText, decodedResult) => {
        // Close modal
        document.body.removeChild(modal);
        
        // Call callback
        if (typeof onScanCallback === 'function') {
            onScanCallback(decodedText, decodedResult);
        }
    });
}

// Export functions to global scope
window.initQRScanner = initQRScanner;
window.startQRScanner = startQRScanner;
window.stopQRScanner = stopQRScanner;
window.openQRScannerModal = openQRScannerModal;
