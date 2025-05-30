/**
 * TrashDrop Collector - Request Detail Component
 * Handles the detailed view of request data with tabbed interface
 */

// Use an IIFE to avoid redefining the RequestDetailView class
(function() {
    // Skip if already defined
    if (window.requestDetailView) {
        return;
    }
    
        // Create the constructor function
    function RequestDetailView() {
        this.container = null;
        this.currentRequestId = null;
        this.currentTab = 'overview';
        this.tabContentElements = {};
    }
    
    /**
     * Initialize the detail view
     */
    RequestDetailView.prototype.init = function() {
        // Create container if it doesn't exist
        if (!this.container) {
            this.createDetailView();
        }
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('Request detail view initialized');
    };
    
    /**
     * Create the detail view DOM structure
     */
    RequestDetailView.prototype.createDetailView = function() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'request-detail-container';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'detail-header';
        header.innerHTML = `
            <h2>Request Details</h2>
            <button class="detail-close-btn">&times;</button>
        `;
        
        // Create tabs
        const tabs = document.createElement('div');
        tabs.className = 'detail-tabs';
        tabs.innerHTML = `
            <div class="detail-tab active" data-tab="overview">Overview</div>
            <div class="detail-tab" data-tab="collection">Collection</div>
            <div class="detail-tab" data-tab="impact">Environmental Impact</div>
            <div class="detail-tab" data-tab="history">History</div>
        `;
        
        // Create tab content containers
        const tabContent = document.createElement('div');
        tabContent.className = 'detail-tab-content-container';
        
        // Overview tab content
        const overviewTab = document.createElement('div');
        overviewTab.className = 'detail-tab-content active';
        overviewTab.id = 'overview-tab';
        
        // Collection tab content
        const collectionTab = document.createElement('div');
        collectionTab.className = 'detail-tab-content';
        collectionTab.id = 'collection-tab';
        
        // Impact tab content
        const impactTab = document.createElement('div');
        impactTab.className = 'detail-tab-content';
        impactTab.id = 'impact-tab';
        
        // History tab content
        const historyTab = document.createElement('div');
        historyTab.className = 'detail-tab-content';
        historyTab.id = 'history-tab';
        
        // Store references to tab content elements
        this.tabContentElements = {
            overview: overviewTab,
            collection: collectionTab,
            impact: impactTab,
            history: historyTab
        };
        
        // Add tab content to container
        tabContent.appendChild(overviewTab);
        tabContent.appendChild(collectionTab);
        tabContent.appendChild(impactTab);
        tabContent.appendChild(historyTab);
        
        // Assemble the view
        this.container.appendChild(header);
        this.container.appendChild(tabs);
        this.container.appendChild(tabContent);
        
        // Add to document
        document.body.appendChild(this.container);
    }
    
    /**
     * Add event listeners to the detail view
     */
    RequestDetailView.prototype.addEventListeners = function() {
        if (!this.container) return;
        
        // Close button
        const closeBtn = this.container.querySelector('.detail-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Tab switching
        const tabs = this.container.querySelectorAll('.detail-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }
    
    /**
     * Switch active tab
     * @param {String} tabId - ID of the tab to switch to
     */
    RequestDetailView.prototype.switchTab = function(tabId) {
        if (!this.container) return;
        
        // Update active tab
        const tabs = this.container.querySelectorAll('.detail-tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update active tab content
        Object.keys(this.tabContentElements).forEach(key => {
            if (key === tabId) {
                this.tabContentElements[key].classList.add('active');
            } else {
                this.tabContentElements[key].classList.remove('active');
            }
        });
        
        // Store current tab
        this.currentTab = tabId;
    }
    
    /**
     * Show the detail view for a specific request
     * @param {String} requestId - ID of the request to display
     */
    RequestDetailView.prototype.show = function(requestId) {
        if (!this.container) return;
        
        // Store current request ID
        this.currentRequestId = requestId;
        
        // Load request data
        this.loadRequestData(requestId);
        
        // Show container
        this.container.classList.add('active');
        
        // Reset to overview tab
        this.switchTab('overview');
    }
    
    /**
     * Hide the detail view
     */
    RequestDetailView.prototype.hide = function() {
        if (!this.container) return;
        
        // Hide container
        this.container.classList.remove('active');
        
        // Clear current request ID
        this.currentRequestId = null;
    }
    
    /**
     * Load request data and populate the view
     * @param {String} requestId - ID of the request to load
     */
    RequestDetailView.prototype.loadRequestData = async function(requestId) {
        try {
            // Get enhanced request data using the adapter function
            const request = window.getEnhancedRequest(requestId);
            
            if (!request) {
                console.error('Request not found:', requestId);
                return;
            }
            
            // Update the view with request data
            this.updateOverviewTab(request);
            this.updateCollectionTab(request);
            this.updateImpactTab(request);
            this.updateHistoryTab(request);
            
            console.log('Loaded request data:', request);
        } catch (error) {
            console.error('Error loading request data:', error);
        }
    }
    
    /**
     * Update the overview tab with request data
     * @param {Object} request - Request data
     */
    RequestDetailView.prototype.updateOverviewTab = function(request) {
        if (!this.tabContentElements.overview) return;
        
        // Format the status for display
        const statusText = request.status.replace('_', ' ');
        const formattedStatus = statusText.charAt(0).toUpperCase() + statusText.slice(1);
        
        // Format created date
        const createdDate = new Date(request.created_at);
        const formattedDate = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString();
        
        // Generate HTML for overview tab
        const html = `
            <div class="detail-section">
                <div class="detail-section-header">
                    Basic Information
                </div>
                <div class="detail-section-content">
                    <div class="field-group">
                        <div class="field-label">Status</div>
                        <div class="field-value">
                            <span class="status-badge ${request.status}">${formattedStatus}</span>
                        </div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Request ID</div>
                        <div class="field-value">${request.id}</div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Created</div>
                        <div class="field-value">${formattedDate}</div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Trash Type</div>
                        <div class="field-value">${request.type || 'General'}</div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Priority</div>
                        <div class="field-value">
                            <span class="priority-indicator ${request.priority || 'medium'}">
                                ${request.priority ? request.priority.charAt(0).toUpperCase() + request.priority.slice(1) : 'Medium'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-header">
                    Location
                </div>
                <div class="detail-section-content">
                    <div class="field-group">
                        <div class="field-label">Address</div>
                        <div class="field-value">${request.address}</div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Coordinates</div>
                        <div class="field-value">${request.coordinates ? `${request.coordinates.lat.toFixed(6)}, ${request.coordinates.lng.toFixed(6)}` : 'N/A'}</div>
                    </div>
                    
                    <button class="action-button" onclick="openDirections(${request.coordinates ? request.coordinates.lat : 0}, ${request.coordinates ? request.coordinates.lng : 0})">
                        Get Directions
                    </button>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-header">
                    Collection Details
                </div>
                <div class="detail-section-content">
                    <div class="field-group">
                        <div class="field-label">Bags</div>
                        <div class="field-value">${request.bags} bag${request.bags !== 1 ? 's' : ''}</div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Estimated Weight</div>
                        <div class="field-value">${request.estimated_weight || (request.bags * 5)} kg</div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Reward Points</div>
                        <div class="field-value">${request.points} points</div>
                    </div>
                    
                    <div class="field-group">
                        <div class="field-label">Base Fee</div>
                        <div class="field-value">$${(typeof request.fee === 'number' ? request.fee.toFixed(2) : request.fee)}</div>
                    </div>
                </div>
            </div>
            
            ${request.description ? `
            <div class="detail-section">
                <div class="detail-section-header">
                    Description
                </div>
                <div class="detail-section-content">
                    <div class="field-value">${request.description}</div>
                </div>
            </div>
            ` : ''}
            
            ${this.getActionButtonHTML(request)}
        `;
        
        // Update the tab content
        this.tabContentElements.overview.innerHTML = html;
    }
    
    /**
     * Update the collection tab with request data
     * @param {Object} request - Request data
     */
    RequestDetailView.prototype.updateCollectionTab = function(request) {
        if (!this.tabContentElements.collection) return;
        
        // Generate HTML for collection tab based on status
        let html = '';
        
        if (request.status === 'pending') {
            html = `
                <div class="detail-section">
                    <div class="detail-section-header">
                        Accept Request
                    </div>
                    <div class="detail-section-content">
                        <p>You can accept this request to start the collection process.</p>
                        <button class="action-button" onclick="acceptRequest('${request.id}')">
                            Accept Request
                        </button>
                    </div>
                </div>
            `;
        } else if (request.status === 'accepted') {
            html = `
                <div class="detail-section">
                    <div class="detail-section-header">
                        Start Collection
                    </div>
                    <div class="detail-section-content">
                        <p>You have accepted this request. When you arrive at the location, you can start the collection process.</p>
                        <button class="action-button" onclick="openQrScanner('${request.id}')">
                            Start Scanning Bags
                        </button>
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-header">
                        Scanned Bags
                    </div>
                    <div class="detail-section-content">
                        <div id="scannedBagsTableContainer">
                            <p>No bags scanned yet.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (request.status === 'in_progress' || request.status === 'completed') {
            // Generate material breakdown if available
            let materialsHTML = '<p>No material data available.</p>';
            
            if (request.sorted_materials && Object.keys(request.sorted_materials).length > 0) {
                materialsHTML = `
                    <div class="materials-breakdown">
                        ${Object.entries(request.sorted_materials).map(([type, weight]) => `
                            <div class="material-item">
                                <span class="material-type">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                <span class="material-weight">${weight} kg</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            html = `
                <div class="detail-section">
                    <div class="detail-section-header">
                        Collection Status
                    </div>
                    <div class="detail-section-content">
                        <div class="field-group">
                            <div class="field-label">Status</div>
                            <div class="field-value">
                                <span class="status-badge ${request.status}">${request.status === 'in_progress' ? 'In Progress' : 'Completed'}</span>
                            </div>
                        </div>
                        
                        ${request.accepted_at ? `
                        <div class="field-group">
                            <div class="field-label">Accepted At</div>
                            <div class="field-value">${new Date(request.accepted_at).toLocaleString()}</div>
                        </div>
                        ` : ''}
                        
                        ${request.completed_at ? `
                        <div class="field-group">
                            <div class="field-label">Completed At</div>
                            <div class="field-value">${new Date(request.completed_at).toLocaleString()}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-header">
                        Materials Collected
                    </div>
                    <div class="detail-section-content">
                        ${materialsHTML}
                    </div>
                </div>
                
                ${request.status === 'in_progress' ? `
                <button class="action-button" onclick="completePickup()">
                    Complete Collection
                </button>
                ` : ''}
            `;
        }
        
        // Update the tab content
        this.tabContentElements.collection.innerHTML = html;
    }
    
    /**
     * Update the environmental impact tab with request data
     * @param {Object} request - Request data
     */
    RequestDetailView.prototype.updateImpactTab = function(request) {
        if (!this.tabContentElements.impact) return;
        
        // Default values if impact data is not available
        const impact = request.environmental_impact || {
            co2_saved: request.bags * 2.5,
            water_saved: request.bags * 100,
            trees_saved: request.bags * 0.05
        };
        
        // Generate HTML for impact tab
        const html = `
            <div class="detail-section">
                <div class="detail-section-header">
                    Environmental Impact Summary
                </div>
                <div class="detail-section-content">
                    <!-- Gauge chart containers -->
                    <div class="impact-gauges" style="display:flex;flex-wrap:wrap;justify-content:space-around;margin-bottom:1rem;">
                        <div id="co2GaugeChart" style="flex:1;min-width:120px;margin:0.5rem;"></div>
                        <div id="waterGaugeChart" style="flex:1;min-width:120px;margin:0.5rem;"></div>
                        <div id="treesGaugeChart" style="flex:1;min-width:120px;margin:0.5rem;"></div>
                    </div>
                    
                    <div class="impact-comparison" style="background:#E8F5E9;padding:0.75rem;border-radius:4px;font-size:0.9rem;margin-top:1rem;">
                        <div style="font-weight:500;margin-bottom:0.5rem;">Environmental Equivalents:</div>
                        <ul style="margin:0;padding-left:1.5rem;">
                            <li>Driving ${(impact.co2_saved / 0.12).toFixed(1)} fewer kilometers in an average car</li>
                            <li>Saving ${(impact.water_saved / 150).toFixed(1)} days of average household water usage</li>
                            <li>${impact.trees_saved.toFixed(2)} trees absorb CO₂ for ${(impact.trees_saved * 365 / 50).toFixed(1)} days</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="detail-section-header">
                    Material Breakdown
                </div>
                <div class="detail-section-content">
                    <!-- Material pie chart container -->
                    <div id="materialsPieChart" class="chart-container" style="display:flex;flex-direction:column;align-items:center;min-height:200px;"></div>
                    
                    <!-- Material bar chart -->
                    <div id="materialsBarChart" class="chart-container" style="margin-top:1.5rem;min-height:150px;"></div>
                </div>
            </div>
        `;
        
        // Update the tab content
        this.tabContentElements.impact.innerHTML = html;
        
        // Render charts after the HTML is added to the DOM
        setTimeout(() => {
            this.renderImpactCharts(request);
        }, 50);
    }
    
    /**
     * Render environmental impact charts using SimpleCharts
     * @param {Object} request - Request data
     */
    RequestDetailView.prototype.renderImpactCharts = function(request) {
        if (!window.SimpleCharts) {
            console.error('SimpleCharts not loaded');
            return;
        }
        
        // Get environmental impact data
        const impact = request.environmental_impact || {
            co2_saved: request.bags * 2.5,
            water_saved: request.bags * 100,
            trees_saved: request.bags * 0.05
        };
        
        // Get material breakdown
        const materials = request.sorted_materials || this.generateDummyMaterials(request);
        
        // 1. Render CO2 gauge chart
        if (document.getElementById('co2GaugeChart')) {
            window.SimpleCharts.createGaugeChart('co2GaugeChart', impact.co2_saved, 50, {
                title: 'CO₂ Saved',
                label: 'kg',
                color: '#4CAF50'
            });
        }
        
        // 2. Render water gauge chart
        if (document.getElementById('waterGaugeChart')) {
            window.SimpleCharts.createGaugeChart('waterGaugeChart', impact.water_saved, 1000, {
                title: 'Water Saved',
                label: 'L',
                color: '#2196F3'
            });
        }
        
        // 3. Render trees gauge chart
        if (document.getElementById('treesGaugeChart')) {
            window.SimpleCharts.createGaugeChart('treesGaugeChart', impact.trees_saved, 1, {
                title: 'Trees Saved',
                label: 'trees',
                color: '#795548'
            });
        }
        
        // 4. Render materials pie chart
        if (document.getElementById('materialsPieChart')) {
            window.SimpleCharts.createPieChart('materialsPieChart', materials, {
                title: 'Material Composition',
                showLegend: true,
                innerRadius: 50, // Create a donut chart
                size: 200
            });
        }
        
        // 5. Render materials bar chart
        if (document.getElementById('materialsBarChart')) {
            // Convert materials object to array for bar chart
            const materialsArray = Object.entries(materials).map(([label, value]) => ({
                label: label.charAt(0).toUpperCase() + label.slice(1),
                value
            }));
            
            // Sort by value (descending)
            materialsArray.sort((a, b) => b.value - a.value);
            
            window.SimpleCharts.createBarChart('materialsBarChart', materialsArray, {
                title: 'Material Weights',
                valueFormatter: (value) => `${value} kg`
            });
        }
    }
    
    /**
     * Generate dummy materials data for preview when real data isn't available
     * @param {Object} request - Request data
     * @returns {Object} - Dummy materials data
     */
    RequestDetailView.prototype.generateDummyMaterials = function(request) {
        // Generate realistic-looking dummy data based on request type and bags
        const totalWeight = request.estimated_weight || (request.bags * 5);
        
        // Different distributions based on trash type
        switch(request.type) {
            case 'recyclable':
                return {
                    plastic: totalWeight * 0.4,
                    paper: totalWeight * 0.3,
                    glass: totalWeight * 0.2,
                    metal: totalWeight * 0.1
                };
            case 'organic':
                return {
                    food: totalWeight * 0.6,
                    yard: totalWeight * 0.3,
                    other: totalWeight * 0.1
                };
            case 'hazardous':
                return {
                    chemical: totalWeight * 0.4,
                    electronic: totalWeight * 0.3,
                    batteries: totalWeight * 0.2,
                    other: totalWeight * 0.1
                };
            case 'mixed':
            default:
                return {
                    general: totalWeight * 0.4,
                    plastic: totalWeight * 0.2,
                    paper: totalWeight * 0.15,
                    organic: totalWeight * 0.15,
                    glass: totalWeight * 0.05,
                    metal: totalWeight * 0.05
                };
        }
    }
    
    /**
     * Update the history tab with request data
     * @param {Object} request - Request data
     */
    RequestDetailView.prototype.updateHistoryTab = function(request) {
        if (!this.tabContentElements.history) return;
        
        // Generate timeline HTML from chain of custody
        let timelineHTML = '<p>No history available.</p>';
        
        if (request.chain_of_custody && request.chain_of_custody.length > 0) {
            timelineHTML = `
                <div class="timeline">
                    ${request.chain_of_custody.map((event, index) => `
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <div class="timeline-date">${new Date(event.timestamp).toLocaleString()}</div>
                                <div class="timeline-title">${event.action.charAt(0).toUpperCase() + event.action.slice(1)}</div>
                                <div class="timeline-body">
                                    <div>Handler: ${event.handler_type.charAt(0).toUpperCase() + event.handler_type.slice(1)}</div>
                                    ${event.location ? `<div>Location: ${event.location.lat.toFixed(6)}, ${event.location.lng.toFixed(6)}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Generate QR codes section if available
        let qrCodesHTML = '';
        
        if (request.qr_codes && request.qr_codes.length > 0) {
            qrCodesHTML = `
                <div class="detail-section">
                    <div class="detail-section-header">
                        QR Codes
                    </div>
                    <div class="detail-section-content">
                        <div class="qr-codes-list">
                            ${request.qr_codes.map(code => `
                                <div class="qr-code-item">
                                    <span class="qr-code">${code}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Generate HTML for history tab
        const html = `
            <div class="detail-section">
                <div class="detail-section-header">
                    Timeline
                </div>
                <div class="detail-section-content">
                    ${timelineHTML}
                </div>
            </div>
            
            ${qrCodesHTML}
        `;
        
        // Update the tab content
        this.tabContentElements.history.innerHTML = html;
    };
        

    
/**
 * Get HTML for the appropriate action button based on request status
 * @param {Object} request - Request data
 * @returns {String} - HTML for action button
 */
RequestDetailView.prototype.getActionButtonHTML = function(request) {
    if (request.status === 'pending') {
        return `
            <button class="action-button" onclick="acceptRequest('${request.id}')">
                Accept Request
            </button>
        `;
    } else if (request.status === 'accepted') {
        return `
            <button class="action-button" onclick="openQrScanner('${request.id}')">
                Start Collection
            </button>
        `;
    } else if (request.status === 'in_progress') {
        return `
            <button class="action-button" onclick="completePickup()">
                Complete Collection
            </button>
        `;
    } else if (request.status === 'completed') {
        return `
            <button class="action-button" onclick="viewDisposalReport('${request.id}')">
                View Report
            </button>
        `;
    } else {
        return '';
    }
    }

    // Create and export the singleton instance
    window.requestDetailView = new RequestDetailView();
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        if (window.requestDetailView && typeof window.requestDetailView.init === 'function') {
            window.requestDetailView.init();
        }
    });
})();
