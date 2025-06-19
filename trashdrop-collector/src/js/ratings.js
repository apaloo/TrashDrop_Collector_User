/**
 * TrashDrop Collector - Ratings Module
 * Handles ratings functionality for the application
 */

(function() {
    console.log('🌟 Ratings: Initializing module');
    
    // Initialize the ratings system
    function initRatings() {
        // Wait for Supabase client to be ready
        if (typeof window.waitForSupabaseClient === 'function') {
            window.waitForSupabaseClient(function() {
                setupRatingsSystem();
            });
        } else {
            // Fallback if waitForSupabaseClient is not available
            document.addEventListener('supabaseClientReady', setupRatingsSystem);
            document.addEventListener('supabaseClientInitialized', setupRatingsSystem);
            
            // Add timeout fallback
            setTimeout(setupRatingsSystem, 3000);
        }
    }
    
    // Set up the rating system
    function setupRatingsSystem() {
        console.log('🌟 Ratings: Setting up ratings system');
        
        // Check if already initialized
        if (window.ratingsInitialized) {
            console.log('🌟 Ratings: Already initialized');
            return;
        }
        
        // Mark as initialized
        window.ratingsInitialized = true;
        
        // Attach rating handlers to any rating elements
        const ratingElements = document.querySelectorAll('.rating-control');
        
        if (ratingElements.length === 0) {
            console.log('🌟 Ratings: No rating elements found on this page');
            return;
        }
        
        console.log(`🌟 Ratings: Found ${ratingElements.length} rating elements`);
        
        // Initialize each rating element
        ratingElements.forEach(element => {
            initRatingElement(element);
        });
    }
    
    // Initialize individual rating element
    function initRatingElement(element) {
        const requestId = element.getAttribute('data-request-id');
        
        if (!requestId) {
            console.warn('🌟 Ratings: Rating element missing request ID');
            return;
        }
        
        // Create stars if they don't exist
        if (element.children.length === 0) {
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.className = 'rating-star';
                star.textContent = '★';
                star.setAttribute('data-rating', i);
                star.addEventListener('click', function() {
                    submitRating(requestId, i);
                });
                element.appendChild(star);
            }
        }
        
        // Load existing rating if available
        loadExistingRating(requestId, element);
    }
    
    // Load existing rating from database
    function loadExistingRating(requestId, element) {
        // Get current user for checking permissions
        getCurrentUser().then(userData => {
            if (!userData || !userData.user) {
                console.log('🌟 Ratings: No user found, cannot load ratings');
                return;
            }
            
            const { user } = userData;
            
            // Use Supabase client to get rating if available
            if (window.supabaseClient) {
                window.supabaseClient
                    .from('ratings')
                    .select('*')
                    .eq('request_id', requestId)
                    .eq('user_id', user.id)
                    .then(response => {
                        if (response.data && response.data.length > 0) {
                            const rating = response.data[0].rating;
                            displayRating(element, rating);
                        }
                    })
                    .catch(error => {
                        console.warn('🌟 Ratings: Error loading existing rating', error);
                    });
            }
        }).catch(error => {
            console.warn('🌟 Ratings: Error getting user', error);
        });
    }
    
    // Display a rating on an element
    function displayRating(element, rating) {
        const stars = element.querySelectorAll('.rating-star');
        
        stars.forEach((star, index) => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            
            if (starRating <= rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    // Submit a rating to the database
    function submitRating(requestId, rating) {
        console.log(`🌟 Ratings: Submitting rating ${rating} for request ${requestId}`);
        
        // Get current user
        getCurrentUser().then(userData => {
            if (!userData || !userData.user) {
                console.log('🌟 Ratings: No user found, cannot submit rating');
                return;
            }
            
            const { user } = userData;
            
            // Submit to database if Supabase client is available
            if (window.supabaseClient) {
                window.supabaseClient
                    .from('ratings')
                    .upsert({
                        request_id: requestId,
                        user_id: user.id,
                        rating: rating,
                        created_at: new Date().toISOString()
                    })
                    .then(response => {
                        if (!response.error) {
                            console.log('🌟 Ratings: Rating submitted successfully');
                            // Update UI
                            const element = document.querySelector(`.rating-control[data-request-id="${requestId}"]`);
                            if (element) {
                                displayRating(element, rating);
                            }
                        } else {
                            console.error('🌟 Ratings: Error submitting rating', response.error);
                        }
                    })
                    .catch(error => {
                        console.error('🌟 Ratings: Error submitting rating', error);
                    });
            }
        }).catch(error => {
            console.warn('🌟 Ratings: Error getting user', error);
        });
    }
    
    // Helper function to get current user with fallbacks
    function getCurrentUser() {
        return new Promise((resolve, reject) => {
            // Try standard getCurrentUser function
            if (typeof window.getCurrentUser === 'function') {
                try {
                    const result = window.getCurrentUser();
                    // Check if it's a promise or direct result
                    if (result && typeof result.then === 'function') {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    console.warn('🌟 Ratings: Error in getCurrentUser', e);
                    getMockUserFallback().then(resolve).catch(reject);
                }
            } else {
                // Try Supabase client directly
                if (window.supabaseClient && window.supabaseClient.auth) {
                    try {
                        // Try v2 API first
                        if (typeof window.supabaseClient.auth.getUser === 'function') {
                            window.supabaseClient.auth.getUser()
                                .then(response => {
                                    if (response && response.data && response.data.user) {
                                        resolve({ user: response.data.user });
                                    } else {
                                        getMockUserFallback().then(resolve).catch(reject);
                                    }
                                })
                                .catch(error => {
                                    console.warn('🌟 Ratings: Auth error', error);
                                    getMockUserFallback().then(resolve).catch(reject);
                                });
                        } 
                        // Try v1 API
                        else if (typeof window.supabaseClient.auth.user === 'function') {
                            const user = window.supabaseClient.auth.user();
                            if (user) {
                                resolve({ user });
                            } else {
                                getMockUserFallback().then(resolve).catch(reject);
                            }
                        } else {
                            getMockUserFallback().then(resolve).catch(reject);
                        }
                    } catch (e) {
                        console.warn('🌟 Ratings: Error with Supabase auth', e);
                        getMockUserFallback().then(resolve).catch(reject);
                    }
                } else {
                    // No auth methods available, use mock user
                    getMockUserFallback().then(resolve).catch(reject);
                }
            }
        });
    }
    
    // Get a mock user as fallback
    function getMockUserFallback() {
        return new Promise((resolve) => {
            try {
                // Try to get mock user from localStorage
                const mockUserString = localStorage.getItem('mockUser');
                if (mockUserString) {
                    const mockUser = JSON.parse(mockUserString);
                    resolve({ user: mockUser });
                    return;
                }
            } catch (e) {
                console.warn('🌟 Ratings: Error getting mock user', e);
            }
            
            // Create a new mock user
            const mockUser = {
                id: 'ratings-mock-user-' + Date.now(),
                email: 'test@example.com',
                name: 'Ratings Mock User',
                created_at: new Date().toISOString(),
                role: 'collector'
            };
            
            // Save to localStorage
            try {
                localStorage.setItem('mockUser', JSON.stringify(mockUser));
            } catch (e) {
                console.warn('🌟 Ratings: Error saving mock user', e);
            }
            
            resolve({ user: mockUser });
        });
    }
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRatings);
    } else {
        // DOM already loaded
        initRatings();
    }
    
    // Expose global access to ratings functions
    window.TrashDrop = window.TrashDrop || {};
    window.TrashDrop.ratings = {
        init: initRatings,
        submitRating: submitRating,
        displayRating: displayRating
    };
})();
