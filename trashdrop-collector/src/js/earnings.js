// earnings.js - Handles earnings functionality for TrashDrop Collector

// Create a backup mock implementation for immediate testing
const mockData = {
    totalEarnings: 3856.50,
    completedJobs: 78,
    averagePerJob: 49.44,
    byWorkType: {
        'Assignments': {
            count: 45,
            earnings: 2150.75
        },
        'Pickups': {
            count: 33,
            earnings: 1705.75
        }
    },
    byTrashType: {
        'Plastic': {
            count: 28,
            earnings: 1400.00
        },
        'Paper': {
            count: 16,
            earnings: 800.50
        },
        'Glass': {
            count: 12,
            earnings: 720.00
        },
        'Metal': {
            count: 14,
            earnings: 686.00
        },
        'Organic': {
            count: 8,
            earnings: 250.00
        }
    },
    recentPayments: [
        {
            id: 1,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 1250.00,
            payment_method: 'Bank Transfer',
            status: 'completed'
        },
        {
            id: 2,
            created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 800.50,
            payment_method: 'Mobile Money',
            status: 'completed'
        },
        {
            id: 3,
            created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 950.25,
            payment_method: 'Bank Transfer',
            status: 'completed'
        }
    ]
};

// Initialize Supabase client from config if possible, otherwise use mock
let supabase;
try {
    // Using window.supabase since it's loaded from CDN
    if (window.supabase) {
        supabase = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key
        );
        console.log('Supabase client initialized successfully');
    } else {
        throw new Error('Supabase client not available');
    }
} catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Create a mock supabase client with no-op methods
    supabase = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        gte: () => ({
                            lte: () => Promise.resolve({ data: [], error: null })
                        })
                    })
                }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: null })
                })
            })
        })
    };
    console.log('Using mock Supabase client');
}

// Global variables
let currentPeriod = 'week';
let earningsChart = null;
let userId = null;

// Data structure for earnings
const earningsData = {
    totalEarnings: 0,
    completedJobs: 0,
    averagePerJob: 0,
    byTrashType: {},
    byWorkType: {},
    recentPayments: []
};

// Initialize the earnings page
async function initializeEarningsPage() {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            // For demo purposes, continue with mock data even without login
            console.log('No user found, but continuing with mock data for demo');
            userId = 'demo-user-id';
        } else {
            userId = user.id;
        }
        
        // Set up event listeners
        setupEventListeners();
        
        // Load mock data immediately for demo purposes
        loadMockData(currentPeriod);
        
        // Initialize chart
        initializeEarningsChart();
        
        // Update UI
        updateEarningsUI();
        
    } catch (error) {
        console.error('Error initializing earnings page:', error);
        // Ensure mock data is loaded even if there's an error
        loadMockData(currentPeriod);
        initializeEarningsChart();
        updateEarningsUI();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Period selector buttons
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remove active class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update period and reload data
            currentPeriod = button.getAttribute('data-period');
            await loadEarningsData(currentPeriod);
            updateEarningsChart();
            updateEarningsUI();
        });
    });
    
    // View all payments button
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            showAllPayments();
        });
    }
    
    // Add cash out button event listener
    const cashOutBtn = document.getElementById('cashOutBtn');
    if (cashOutBtn) {
        cashOutBtn.addEventListener('click', () => {
            showCashOutModal();
        });
    }
    
    // Close modal button
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });
    
    // Confirm cash out button
    const confirmCashOutBtn = document.getElementById('confirmCashOutBtn');
    if (confirmCashOutBtn) {
        confirmCashOutBtn.addEventListener('click', () => {
            processCashOut();
        });
    }
}

// Load earnings data from Supabase
async function loadEarningsData(period) {
    // Get date range for the selected period
    const { startDate, endDate } = getDateRangeForPeriod(period);
    
    // Fetch assignments data
    const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('collector_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());
    
    if (assignmentsError) throw assignmentsError;
    
    // Fetch pickup requests data
    const { data: pickups, error: pickupsError } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('collector_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());
    
    if (pickupsError) throw pickupsError;
    
    // Fetch payments data
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (paymentsError) throw paymentsError;
    
    // Check if we have any data
    if ((!assignments || assignments.length === 0) && 
        (!pickups || pickups.length === 0) && 
        (!payments || payments.length === 0)) {
        // If no data available, throw error to trigger mock data
        throw new Error('No earnings data found');
    }
    
    // Process the data
    processEarningsData(assignments, pickups, payments, period);
}

// Process earnings data
function processEarningsData(assignments, pickups, payments, period) {
    // Reset data
    earningsData.totalEarnings = 0;
    earningsData.completedJobs = 0;
    earningsData.byTrashType = {};
    earningsData.byWorkType = {
        assignments: { count: 0, earnings: 0 },
        pickups: { count: 0, earnings: 0 }
    };
    
    // Process assignments
    assignments.forEach(assignment => {
        earningsData.totalEarnings += assignment.payment_amount || 0;
        earningsData.completedJobs++;
        earningsData.byWorkType.assignments.count++;
        earningsData.byWorkType.assignments.earnings += assignment.payment_amount || 0;
        
        // Group by trash type
        const trashType = assignment.trash_type || 'Unknown';
        if (!earningsData.byTrashType[trashType]) {
            earningsData.byTrashType[trashType] = { count: 0, earnings: 0 };
        }
        earningsData.byTrashType[trashType].count++;
        earningsData.byTrashType[trashType].earnings += assignment.payment_amount || 0;
    });
    
    // Process pickups
    pickups.forEach(pickup => {
        earningsData.totalEarnings += pickup.payment_amount || 0;
        earningsData.completedJobs++;
        earningsData.byWorkType.pickups.count++;
        earningsData.byWorkType.pickups.earnings += pickup.payment_amount || 0;
        
        // Group by trash type
        const trashType = pickup.trash_type || 'Unknown';
        if (!earningsData.byTrashType[trashType]) {
            earningsData.byTrashType[trashType] = { count: 0, earnings: 0 };
        }
        earningsData.byTrashType[trashType].count++;
        earningsData.byTrashType[trashType].earnings += pickup.payment_amount || 0;
    });
    
    // Calculate average
    earningsData.averagePerJob = earningsData.completedJobs > 0 
        ? earningsData.totalEarnings / earningsData.completedJobs 
        : 0;
    
    // Set recent payments
    earningsData.recentPayments = payments || [];
    
    // Generate chart data
    generateChartData(period, assignments, pickups);
}

// Generate chart data based on period
function generateChartData(period, assignments, pickups) {
    const { labels, dateFormat } = getLabelsForPeriod(period);
    
    // Create an object to hold earnings by date
    const earningsByDate = {};
    
    // Initialize with zeros
    labels.forEach(label => {
        earningsByDate[label] = 0;
    });
    
    // Group assignments by date
    assignments.forEach(assignment => {
        const date = new Date(assignment.completed_at);
        const label = formatDateForPeriod(date, period);
        
        if (earningsByDate.hasOwnProperty(label)) {
            earningsByDate[label] += assignment.payment_amount || 0;
        }
    });
    
    // Group pickups by date
    pickups.forEach(pickup => {
        const date = new Date(pickup.completed_at);
        const label = formatDateForPeriod(date, period);
        
        if (earningsByDate.hasOwnProperty(label)) {
            earningsByDate[label] += pickup.payment_amount || 0;
        }
    });
    
    // Convert to array for chart
    const chartData = labels.map(label => earningsByDate[label]);
    
    // Update chart data
    if (earningsChart) {
        earningsChart.data.labels = labels;
        earningsChart.data.datasets[0].data = chartData;
        earningsChart.update();
    } else {
        // Store data for when chart is initialized
        window.initialChartData = {
            labels: labels,
            data: chartData
        };
    }
}

// Format date based on period
function formatDateForPeriod(date, period) {
    switch (period) {
        case 'day':
            return date.getHours() + ':00';
        case 'week':
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[date.getDay()];
        case 'month':
            return 'Week ' + Math.ceil(date.getDate() / 7);
        case 'year':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[date.getMonth()];
        default:
            return '';
    }
}

// Get date range for the selected period
function getDateRangeForPeriod(period) {
    const now = new Date();
    let startDate = new Date();
    const endDate = now;
    
    switch (period) {
        case 'day':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
    }
    
    return { startDate, endDate };
}

// Get labels for the selected period
function getLabelsForPeriod(period) {
    switch (period) {
        case 'day':
            return {
                labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                dateFormat: 'hour'
            };
        case 'week':
            return {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                dateFormat: 'day'
            };
        case 'month':
            return {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                dateFormat: 'week'
            };
        case 'year':
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                dateFormat: 'month'
            };
        default:
            return { labels: [], dateFormat: '' };
    }
}

// Initialize earnings chart
function initializeEarningsChart() {
    const ctx = document.getElementById('earningsChart');
    if (!ctx) return;
    
    const ctx2d = ctx.getContext('2d');
    
    // Use initial data if available, otherwise use defaults
    const initialData = window.initialChartData || {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [0, 0, 0, 0, 0, 0, 0]
    };
    
    const data = {
        labels: initialData.labels,
        datasets: [{
            label: 'Earnings (₵)',
            data: initialData.data,
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderColor: '#4CAF50',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₵' + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Earnings: ₵${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    };
    
    earningsChart = new Chart(ctx2d, config);
}

// Update earnings UI with the latest data
function updateEarningsUI() {
    console.log('Updating UI with data:', earningsData);
    
    // Update total earnings
    const totalEarningsEl = document.querySelector('.stat-item:nth-child(1) .stat-value');
    if (totalEarningsEl) {
        totalEarningsEl.textContent = `₵${earningsData.totalEarnings.toFixed(2)}`;
    } else {
        console.error('Total earnings element not found');
    }
    
    // Update completed jobs
    const completedJobsEl = document.querySelector('.stat-item:nth-child(2) .stat-value');
    if (completedJobsEl) {
        completedJobsEl.textContent = earningsData.completedJobs;
    } else {
        console.error('Completed jobs element not found');
    }
    
    // Update average per job
    const avgPerJobEl = document.querySelector('.stat-item:nth-child(3) .stat-value');
    if (avgPerJobEl) {
        avgPerJobEl.textContent = `₵${earningsData.averagePerJob.toFixed(2)}`;
    } else {
        console.error('Average per job element not found');
    }
    
    // Update work type breakdown
    updateWorkTypeBreakdown();
    
    // Update trash type breakdown
    updateTrashTypeBreakdown();
    
    // Update recent payments
    updateRecentPayments();
}

// Update work type breakdown section
function updateWorkTypeBreakdown() {
    const workTypeBreakdownEl = document.getElementById('workTypeBreakdown');
    if (!workTypeBreakdownEl) return;
    
    // Clear existing content
    workTypeBreakdownEl.innerHTML = '';
    
    // Check if we have work type data
    if (Object.keys(earningsData.byWorkType).length === 0) {
        workTypeBreakdownEl.innerHTML = '<p class="empty-state">No work type data available</p>';
        return;
    }
    
    // Create work type items
    for (const [type, data] of Object.entries(earningsData.byWorkType)) {
        // The type is already properly formatted in our mock data
        const displayType = type;
        
        const workTypeItem = document.createElement('div');
        workTypeItem.className = 'breakdown-item';
        workTypeItem.innerHTML = `
            <div class="breakdown-item-title">${displayType}</div>
            <div class="breakdown-item-stats">
                <span class="breakdown-item-count">${data.count} jobs</span>
                <span class="breakdown-item-amount">₵${data.earnings.toFixed(2)}</span>
            </div>
        `;
        
        workTypeBreakdownEl.appendChild(workTypeItem);
    }
}

// Update trash type breakdown section
function updateTrashTypeBreakdown() {
    const trashTypeBreakdownEl = document.getElementById('trashTypeBreakdown');
    if (!trashTypeBreakdownEl) return;
    
    // Clear existing content
    trashTypeBreakdownEl.innerHTML = '';
    
    // Check if we have trash type data
    if (Object.keys(earningsData.byTrashType).length === 0) {
        trashTypeBreakdownEl.innerHTML = '<p class="empty-state">No trash type data available</p>';
        return;
    }
    
    // Create trash type items
    for (const [type, data] of Object.entries(earningsData.byTrashType)) {
        const trashTypeItem = document.createElement('div');
        trashTypeItem.className = 'breakdown-item';
        trashTypeItem.innerHTML = `
            <div class="breakdown-item-title">${type}</div>
            <div class="breakdown-item-stats">
                <span class="breakdown-item-count">${data.count} jobs</span>
                <span class="breakdown-item-amount">₵${data.earnings.toFixed(2)}</span>
            </div>
        `;
        
        trashTypeBreakdownEl.appendChild(trashTypeItem);
    }
}

// Update recent payments section
function updateRecentPayments() {
    const recentPaymentsEl = document.getElementById('recentPayments');
    if (!recentPaymentsEl) return;
    
    // Clear existing content
    recentPaymentsEl.innerHTML = '';
    
    // Check if we have payments data
    if (earningsData.recentPayments.length === 0) {
        recentPaymentsEl.innerHTML = '<p class="empty-state">No payment history available yet</p>';
        return;
    }
    
    // Create payment items
    earningsData.recentPayments.forEach(payment => {
        const date = new Date(payment.created_at);
        const formattedDate = date.toLocaleDateString();
        
        const paymentItem = document.createElement('div');
        paymentItem.className = 'payment-item';
        paymentItem.innerHTML = `
            <div class="payment-info">
                <div class="payment-date">${formattedDate}</div>
                <div class="payment-method">${payment.payment_method || 'Bank Transfer'}</div>
            </div>
            <div class="payment-amount">₵${payment.amount.toFixed(2)}</div>
        `;
        
        recentPaymentsEl.appendChild(paymentItem);
    });
}

// Show all payments (for view all button)
function showAllPayments() {
    // In a real implementation, this would open a full payments history page
    // or expand the current view to show more payments
    alert('Full payment history feature coming soon');
}

// Show cash out modal
function showCashOutModal() {
    const cashOutModal = document.getElementById('cashOutModal');
    if (!cashOutModal) return;
    
    // Update available balance
    const availableBalanceEl = document.getElementById('availableBalance');
    if (availableBalanceEl) {
        availableBalanceEl.textContent = `₵${earningsData.totalEarnings.toFixed(2)}`;
    }
    
    // Show modal
    cashOutModal.classList.add('active');
}

// Process cash out request
async function processCashOut() {
    const amountInput = document.getElementById('cashOutAmount');
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (amount > earningsData.totalEarnings) {
        alert('Amount exceeds available balance');
        return;
    }
    
    try {
        // In a real implementation, this would call Supabase to create a withdrawal request
        const { data, error } = await supabase
            .from('withdrawals')
            .insert([
                {
                    user_id: userId,
                    amount: amount,
                    status: 'pending'
                }
            ]);
        
        if (error) throw error;
        
        // Show processing message
        const cashOutModal = document.getElementById('cashOutModal');
        if (cashOutModal) {
            cashOutModal.classList.remove('active');
        }
        
        // Redirect to payment gateway (simulated)
        // In a real app, this would redirect to an actual payment gateway
        setTimeout(() => {
            alert(`Processing withdrawal of ₵${amount.toFixed(2)}. You'll be redirected to the payment gateway.`);
            
            // Simulated redirect
            // window.location.href = "https://payment-gateway.example.com";
        }, 1000);
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        alert('Failed to process withdrawal. Please try again.');
    }
}

// Load mock data for demo purposes
function loadMockData(period) {
    // Generate consistent earnings data for demo
    earningsData.totalEarnings = 3856.50;
    earningsData.completedJobs = 78;
    earningsData.averagePerJob = earningsData.totalEarnings / earningsData.completedJobs;
    
    // Mock work type data
    earningsData.byWorkType = {
        'Assignments': {
            count: 45,
            earnings: 2150.75
        },
        'Pickups': {
            count: 33,
            earnings: 1705.75
        }
    };
    
    // Mock trash type data
    earningsData.byTrashType = {
        'Plastic': {
            count: 28,
            earnings: 1400.00
        },
        'Paper': {
            count: 16,
            earnings: 800.50
        },
        'Glass': {
            count: 12,
            earnings: 720.00
        },
        'Metal': {
            count: 14,
            earnings: 686.00
        },
        'Organic': {
            count: 8,
            earnings: 250.00
        }
    };
    
    // Mock payment history
    earningsData.recentPayments = [
        {
            id: 1,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 1250.00,
            payment_method: 'Bank Transfer',
            status: 'completed'
        },
        {
            id: 2,
            created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 800.50,
            payment_method: 'Mobile Money',
            status: 'completed'
        },
        {
            id: 3,
            created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 950.25,
            payment_method: 'Bank Transfer',
            status: 'completed'
        }
    ];
    
    // Add mock payment methods
    setTimeout(() => {
        const paymentMethodsContainer = document.getElementById('paymentMethods');
        if (paymentMethodsContainer) {
            paymentMethodsContainer.innerHTML = '';
            
            // Bank account
            const bankMethod = document.createElement('div');
            bankMethod.className = 'payment-method-item';
            bankMethod.innerHTML = `
                <div class="payment-method-icon">
                    <span class="material-icons">account_balance</span>
                </div>
                <div class="payment-method-details">
                    <div class="payment-method-title">Bank Account</div>
                    <div class="payment-method-subtitle">Ending in 4325</div>
                </div>
                <div class="payment-method-action">
                    <button class="btn btn-icon">
                        <span class="material-icons">edit</span>
                    </button>
                </div>
            `;
            paymentMethodsContainer.appendChild(bankMethod);
            
            // Mobile money
            const mobileMethod = document.createElement('div');
            mobileMethod.className = 'payment-method-item';
            mobileMethod.innerHTML = `
                <div class="payment-method-icon">
                    <span class="material-icons">smartphone</span>
                </div>
                <div class="payment-method-details">
                    <div class="payment-method-title">Mobile Money</div>
                    <div class="payment-method-subtitle">+233 55 123 4567</div>
                </div>
                <div class="payment-method-action">
                    <button class="btn btn-icon">
                        <span class="material-icons">edit</span>
                    </button>
                </div>
            `;
            paymentMethodsContainer.appendChild(mobileMethod);
            
            // Add payment method button
            const addMethod = document.createElement('div');
            addMethod.className = 'payment-method-item';
            addMethod.innerHTML = `
                <div class="payment-method-icon">
                    <span class="material-icons">add_circle</span>
                </div>
                <div class="payment-method-details">
                    <div class="payment-method-title">Add Payment Method</div>
                    <div class="payment-method-subtitle">Set up your preferred payment methods</div>
                </div>
                <div class="payment-method-action">
                    <button class="btn btn-icon">
                        <span class="material-icons">arrow_forward</span>
                    </button>
                </div>
            `;
            paymentMethodsContainer.appendChild(addMethod);
        }
    }, 100); // Small delay to ensure DOM is ready
    
    // Generate chart data based on period
    const { labels } = getLabelsForPeriod(period);
    let chartData;
    
    switch(period) {
        case 'week':
            chartData = [425.50, 380.25, 520.75, 0, 680.00, 750.50, 1099.50];
            break;
        case 'month':
            chartData = [980.25, 1250.75, 850.50, 775.00];
            break;
        case 'year':
            chartData = [250.50, 320.25, 420.75, 580.00, 680.25, 750.50, 0, 0, 0, 0, 350.25, 504.00];
            break;
        default:
            chartData = labels.map(() => Math.floor(Math.random() * 500) + 100);
    }
    
    // Update chart
    if (earningsChart) {
        earningsChart.data.labels = labels;
        earningsChart.data.datasets[0].data = chartData;
        earningsChart.update();
    } else {
        window.initialChartData = {
            labels: labels,
            data: chartData
        };
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEarningsPage);

// Export functions for testing
window.earningsModule = {
    loadEarningsData,
    showCashOutModal,
    processCashOut
};
