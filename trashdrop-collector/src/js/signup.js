/**
 * TrashDrop Collector - Signup functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const signupForm = document.getElementById('signupForm');
    const phoneInput = document.getElementById('phoneNumber');
    const displayNameInput = document.getElementById('displayName');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const signupError = document.getElementById('signupError');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const verificationSection = document.getElementById('verificationSection');
    const otpCodeInput = document.getElementById('otpCode');
    
    // Development mode flag
    window.isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('192.168');

    // Show status message function
    function showStatus(message, type = 'pending') {
        const statusContainer = document.getElementById('status-container');
        if (!statusContainer) return;

        statusContainer.innerHTML = '';
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        
        if (type === 'pending') {
            statusDiv.innerHTML = `<span class="spinner"></span> ${message}`;
        } else {
            statusDiv.textContent = message;
        }
        
        statusContainer.appendChild(statusDiv);
        statusContainer.style.display = 'block';
    }

    // Validate phone number function
    function validatePhone(phone) {
        // Basic validation - could be enhanced
        return phone && phone.length >= 10;
    }

    // Send OTP handler
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async () => {
            try {
                if (signupError) signupError.textContent = '';
                
                // Get the phone number
                const phoneNumber = phoneInput ? phoneInput.value.trim() : '';
                const displayName = displayNameInput ? displayNameInput.value.trim() : '';
                const agreeTerms = agreeTermsCheckbox ? agreeTermsCheckbox.checked : false;
                
                // Validate inputs
                if (!validatePhone(phoneNumber)) {
                    if (signupError) signupError.textContent = 'Please enter a valid phone number';
                    return;
                }
                
                if (!displayName) {
                    if (signupError) signupError.textContent = 'Please enter your display name';
                    return;
                }
                
                if (!agreeTerms) {
                    if (signupError) signupError.textContent = 'You must agree to the terms of service';
                    return;
                }
                
                showStatus('Sending verification code...', 'pending');
                
                // Handle verification based on environment
                if (window.isDevelopment) {
                    // Mock verification for development
                    console.log('Development mode: Sending OTP to', phoneNumber);
                    
                    setTimeout(() => {
                        // Show verification section
                        if (signupForm) signupForm.classList.add('hidden');
                        if (verificationSection) verificationSection.classList.remove('hidden');
                        
                        // Show dev mode notice
                        const devModeNotice = document.querySelector('.dev-mode-notice');
                        if (devModeNotice) devModeNotice.classList.remove('hidden');
                        
                        showStatus('A verification code has been sent!', 'success');
                    }, 1500);
                } else {
                    // Use Supabase for real verification
                    const supabase = window.supabaseClient;
                    if (!supabase) {
                        throw new Error('Supabase client not initialized');
                    }
                    
                    const { error } = await supabase.auth.signInWithOtp({
                        phone: phoneNumber
                    });
                    
                    if (error) throw error;
                    
                    // Store the display name for later use
                    localStorage.setItem('signupDisplayName', displayName);
                    
                    // Show verification section
                    if (signupForm) signupForm.classList.add('hidden');
                    if (verificationSection) verificationSection.classList.remove('hidden');
                    
                    showStatus('A verification code has been sent!', 'success');
                }
            } catch (error) {
                console.error('OTP send error:', error);
                showStatus('Error: ' + (error.message || 'Failed to send verification code'), 'error');
            }
        });
    }
    
    // Verify OTP handler
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            try {
                // Get the OTP code
                const otpCode = otpCodeInput ? otpCodeInput.value.trim() : '';
                
                if (!otpCode) {
                    showStatus('Please enter the verification code', 'error');
                    return;
                }
                
                showStatus('Verifying code...', 'pending');
                
                // Handle verification based on environment
                if (window.isDevelopment) {
                    // Mock verification for development
                    setTimeout(() => {
                        if (otpCode === '123456' || otpCode === '111111') {
                            showStatus('Signup successful!', 'success');
                            
                            // Create mock user
                            const mockUser = {
                                id: 'mock-user-id',
                                phone: phoneInput.value.trim(),
                                user_metadata: { 
                                    phone: phoneInput.value.trim(),
                                    display_name: displayNameInput.value.trim() 
                                }
                            };
                            
                            // Store in local storage
                            localStorage.setItem('supabase.auth.token', JSON.stringify({
                                access_token: 'mock-token',
                                expires_at: Date.now() + 3600000,
                                user: mockUser
                            }));
                            
                            // Redirect to index page
                            setTimeout(() => {
                                window.location.href = './index.html';
                            }, 1000);
                        } else {
                            showStatus('Invalid verification code. Try 123456 for testing.', 'error');
                        }
                    }, 1500);
                } else {
                    // Use Supabase for real verification
                    const supabase = window.supabaseClient;
                    if (!supabase) {
                        throw new Error('Supabase client not initialized');
                    }
                    
                    const phoneNumber = phoneInput ? phoneInput.value.trim() : '';
                    const displayName = localStorage.getItem('signupDisplayName') || '';
                    
                    // Verify OTP
                    const { error, data } = await supabase.auth.verifyOtp({
                        phone: phoneNumber,
                        token: otpCode,
                        type: 'sms'
                    });
                    
                    if (error) throw error;
                    
                    // Update user metadata
                    if (data && data.user) {
                        await supabase.auth.updateUser({
                            data: { display_name: displayName }
                        });
                    }
                    
                    showStatus('Signup successful!', 'success');
                    
                    // Clean up storage
                    localStorage.removeItem('signupDisplayName');
                    
                    // Redirect to index page
                    setTimeout(() => {
                        window.location.href = './index.html';
                    }, 1000);
                }
            } catch (error) {
                console.error('Verification error:', error);
                showStatus('Error: ' + (error.message || 'Verification failed'), 'error');
            }
        });
    }
    
    // If in development mode, show a notice about test credentials
    if (window.isDevelopment) {
        const devModeNotice = document.querySelector('.dev-mode-notice');
        if (devModeNotice) {
            const phoneField = document.getElementById('phoneNumber');
            if (phoneField && !phoneField.value) {
                phoneField.value = '+12345678901'; // Pre-fill test phone number
            }
            devModeNotice.classList.remove('hidden');
        }
    }
});
