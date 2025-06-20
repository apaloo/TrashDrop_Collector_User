// Function to handle sending OTP verification code
function handleSendOTP(event) {
    event.preventDefault();
    console.log('Send OTP button clicked');
    
    const phoneInput = document.getElementById('phoneNumber');
    const phoneError = document.getElementById('phone-error');
    const verificationSection = document.getElementById('verification-section');
    const statusContainer = document.getElementById('status-container');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    
    // Clear previous errors
    if (phoneError) phoneError.textContent = '';
    
    try {
        // Get and validate phone number
        const rawPhone = phoneInput ? phoneInput.value.trim() : '';
        if (!rawPhone) {
            if (phoneError) phoneError.textContent = 'Please enter a phone number';
            return;
        }
        
        // Simple validation - add + if not present
        const phoneNumber = !rawPhone.startsWith('+') ? 
            '+' + rawPhone.replace(/\D/g, '') : 
            rawPhone.replace(/\s/g, '');
        if (phoneInput) phoneInput.value = phoneNumber; // update with formatted number
        
        // Show status indicator
        showStatus('Sending verification code...', 'pending');
        
        // Disable button while processing
        if (sendOtpBtn) sendOtpBtn.disabled = true;
        
        // Development mode handling
        if (window.isDevelopment) {
            console.log('💡 Development mode: Mock sending verification code to', phoneNumber);
            
            // Show development mode notice with test instructions
            const devModeNotice = document.querySelector('.dev-mode-notice');
            if (devModeNotice) {
                devModeNotice.innerHTML = `
                    <strong>Development Mode</strong>
                    <p>Test phone: <code>+12345678901</code></p>
                    <p>Test code: <code>123456</code></p>
                `;
                devModeNotice.classList.remove('hidden');
            }
            
            // Show verification section
            if (verificationSection) {
                verificationSection.classList.remove('hidden');
                showStatus('Verification code sent! (MOCK MODE)', 'success');
                
                // Focus on verification input
                const verificationInput = document.getElementById('verification-code');
                if (verificationInput) verificationInput.focus();
            } else {
                console.error('Verification section not found!');
            }
            
            // Re-enable the button after a delay
            setTimeout(() => {
                if (sendOtpBtn) sendOtpBtn.disabled = false;
            }, 2000);
            
        } else {
            // Real Supabase implementation
            const supabase = window.supabaseClient;
            if (!supabase) {
                throw new Error('Supabase client not initialized');
            }
            
            // Call signInWithOtp with phone number
            supabase.auth.signInWithOtp({
                phone: phoneNumber
            }).then(({ error }) => {
                if (error) throw error;
                
                // Show verification section on success
                if (verificationSection) {
                    verificationSection.classList.remove('hidden');
                    showStatus('Verification code sent!', 'success');
                    
                    // Focus on verification input
                    const verificationInput = document.getElementById('verification-code');
                    if (verificationInput) verificationInput.focus();
                }
                
                // Re-enable button
                if (sendOtpBtn) sendOtpBtn.disabled = false;
            }).catch(error => {
                console.warn('✖ OTP request error:', error);
                showStatus(`Error: ${error.message}`, 'error');
                if (sendOtpBtn) sendOtpBtn.disabled = false;
            });
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showStatus('Error: ' + (error.message || 'Failed to send code'), 'error');
        
        // Re-enable the button
        if (sendOtpBtn) sendOtpBtn.disabled = false;
    }
}

// Function to handle OTP verification
function handleVerifyOTP(event) {
    event.preventDefault();
    console.log('Verify OTP button clicked');
    
    const verificationCode = document.getElementById('verification-code');
    const verificationError = document.getElementById('verification-error');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    
    // Clear previous errors
    if (verificationError) verificationError.textContent = '';
    
    try {
        // Get and validate OTP code
        const otpCode = verificationCode ? verificationCode.value.trim() : '';
        if (!otpCode) {
            if (verificationError) verificationError.textContent = 'Please enter the verification code';
            return;
        }
        
        // Show status indicator
        showStatus('Verifying code...', 'pending');
        
        // Disable button while processing
        if (verifyOtpBtn) verifyOtpBtn.disabled = true;
        
        // Development mode handling
        if (window.isDevelopment) {
            console.log('💡 Development mode: Mock verifying OTP code');
            
            // Check if using test credentials
            const phoneInput = document.getElementById('phoneNumber');
            const phoneNumber = phoneInput ? phoneInput.value.trim() : '';
            
            if (phoneNumber === '+12345678901' && otpCode === '123456') {
                console.log('Test credentials verified successfully!');
                showStatus('Verification successful!', 'success');
                
                // Set demo user in session for fallback auth
                const mockUser = {
                    id: 'mock-user-id',
                    phone: phoneNumber,
                    user_metadata: { phone: phoneNumber }
                };
                localStorage.setItem('supabase.auth.token', JSON.stringify({
                    access_token: 'mock-token',
                    expires_at: Date.now() + 3600000,
                    user: mockUser
                }));
                
                // Mock successful authentication
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 1000);
            } else {
                console.log('Invalid test credentials');
                showStatus('Invalid verification code', 'error');
                if (verifyOtpBtn) verifyOtpBtn.disabled = false;
            }
        } else {
            // Real Supabase implementation
            const supabase = window.supabaseClient;
            if (!supabase) {
                throw new Error('Supabase client not initialized');
            }
            
            // Verify OTP with Supabase
            supabase.auth.verifyOtp({
                phone: document.getElementById('phoneNumber').value.trim(),
                token: otpCode,
                type: 'sms'
            }).then(({ error }) => {
                if (error) throw error;
                
                showStatus('Authentication successful!', 'success');
                setTimeout(() => window.location.href = './index.html', 1000);
            }).catch(error => {
                console.error('Verification error:', error);
                showStatus('Error: ' + (error.message || 'Verification failed'), 'error');
                if (verifyOtpBtn) verifyOtpBtn.disabled = false;
            });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showStatus('Error: ' + (error.message || 'Failed to verify code'), 'error');
        
        // Re-enable the button
        if (verifyOtpBtn) verifyOtpBtn.disabled = false;
    }
}

// Helper function to show status messages
function showStatus(message, type = 'pending') {
    const statusContainer = document.getElementById('status-container');
    if (statusContainer) {
        statusContainer.innerHTML = `<div class="status-indicator status-${type}">${message}</div>`;
    } else {
        console.warn('Status container not found, message:', message);
    }
}

// Current user fallback for testing
function getCurrentUserFallback() {
    return {
        id: 'demo-user-id',
        email: 'demo@example.com',
        phone: '+12345678901',
        user_metadata: {
            phone: '+12345678901',
            name: 'Demo User'
        }
    };
}

// Initialize authentication components
document.addEventListener('DOMContentLoaded', () => {
    // Make fallback available globally
    window.getCurrentUserFallback = getCurrentUserFallback;
    
    // Set up event handlers for OTP buttons
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    
    // Attach event handlers directly to buttons
    if (sendOtpBtn) {
        sendOtpBtn.onclick = handleSendOTP;
    }
    
    if (verifyOtpBtn) {
        verifyOtpBtn.onclick = handleVerifyOTP;
    }
    
    // Set up enter key handling for inputs
    const phoneInput = document.getElementById('phoneNumber');
    const verificationInput = document.getElementById('verification-code');
    
    if (phoneInput) {
        phoneInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && sendOtpBtn) {
                handleSendOTP(event);
            }
        });
    }
    
    if (verificationInput) {
        verificationInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && verifyOtpBtn) {
                handleVerifyOTP(event);
            }
        });
    }
    
    // Remove "Forgot Password" button/functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.style.display = 'none';
    }
});
